# Automation Testing Framework — Agent Guide

Playwright + TypeScript (strict) data-driven testing framework for a system of 8 business modules and 250+ menus. Test cases live in Google Sheets, are synced to committed JSON, and run through a single Playwright entrypoint.

Core idea in one line:

```text
modules/<module>/<submodule>/<page>/  →  <page>.executor.ts + <page>.page.ts
```

**The folder path IS the address.** It must match the Google Sheet byte-for-byte, case-sensitive (module = sheet file, submodule = `SubModule` column, page = tab name). The registry resolves executors from this path by convention — no registration files, no separate `pages/` tree.

## Execution Flow

```text
Google Sheets (per module: 1 test-case sheet + 1 test-data sheet; tab = page, row = test case)
  → scripts/sync-sheets.ts        npm run sync-sheets → src/data/*.json (committed)
  → src/engine/cli.ts             env vars: MODULE / SUBMODULE / PAGE (optional filters),
                                  RUNMODE (default normal; "full" runs ALL modes), ENV (default dev)
  → src/engine/loader.ts          scans src/data/ → TestCase[] (never calls the Sheets API)
  → tests/run.spec.ts             one test() per row, titled "TC_ID: Expected", tagged @<mode>;
                                  resolves executor from tc.module/tc.subModule/tc.page
  → src/engine/registry.ts        dynamic import of the nested path, falling back to flat
                                  modules/<page-lowercase>.executor.ts (exists for login only)
  → executor → page object → src/action/baseaction.ts → Playwright
```

Read the actual source for details — it is short and canonical: [tests/run.spec.ts](tests/run.spec.ts), [src/engine/](src/engine/), [src/core/types.ts](src/core/types.ts) (the `TestCase` / `ExecutorMap` contracts), [src/modules/login.executor.ts](src/modules/login.executor.ts) (reference executor).

## Layout

- `src/modules/` — menu code. One folder per menu holding `<page>.executor.ts` + `<page>.page.ts`. Extra files allowed if a page grows (`<page>.locators.ts`, submodule-level `_shared/`), but never rename the executor/page files.
- `src/modules/login.executor.ts` + `login.page.ts` — the ONE flat exception, resolved by the registry's flat fallback. Login is sheet-driven (tab `Login` in `personal-info`); in `mode=full` it uses the `BYPASS` URL instead of credentials.
- `src/engine/` — cli, loader, registry, runner. 100% generic; never add module-specific logic.
- `src/action/baseaction.ts` — central shared action layer (navigation to `SYSTEM_URL`/`ACADEMIC_URL` hosts, interaction wrappers, app widgets like modal reading). Grows deliberately.
- `src/core/` — types + constants (`SHEET_COLUMNS`, `SHEET_MODULES`, run modes, `DATA_DIR`, timeouts). No logic.
- `src/config/environment.ts` — the only place `dotenv` loads. URLs, env selection, per-module sheet IDs from `.env` (`<MODULE>_TESTCASE_SHEET_ID` / `<MODULE>_TESTDATA_SHEET_ID`).
- `src/connectors/google-sheet.client.ts` — Sheets API access; imported ONLY by the sync script.
- `src/data/` — synced JSON, committed, never hand-edited.
- `scripts/sync-sheets.ts` — the only code allowed to call the Google Sheets API.

## Google Sheets → Local Data

Modules: `personal-info`, `academic`, `student-affairs`, `general-admin`, `accounting`, `store`, `report`, `initial-setup`.

Test-case columns: `TC_ID`, `Expected`, `Function` (executor workflow key), `Mode` (`normal`/`smoke`/`regression`/`full`), `Data_ID` (`-` = no data), `Enable` (`FALSE` → `test.skip`), `SubModule` (optional — blank writes to the module root).

Sync rules:

- `npm run sync-sheets` pulls every configured module into `src/data/<module>/<subModule>/<page>.json` and stamps `module` + `page` onto each row. Commit the result; `git diff src/data` IS the test-data change log and part of code review.
- `Data_ID` is resolved module-wide across all data tabs; duplicates fail the sync. Validation (required columns, valid `Mode`, unique `TC_ID` per tab) fails the sync with a non-zero exit.
- Test runs never touch the Sheets API — the loader reads only local JSON. Never hand-edit `src/data/`; fix the sheet and re-sync.

## Running

Scripts are in [package.json](package.json): `npm test` (sync + run), `test:smoke`, `test:full`, each with a `:headed` variant, and `report`. Narrow a run with env vars, e.g. `MODULE=initial-setup SUBMODULE=curriculumSetting PAGE=branchSetting npx playwright test`. All three filters are optional; omitting them runs everything synced.

Config ([playwright.config.ts](playwright.config.ts)): single worker, `list` + HTML reporter, `trace: retain-on-failure`, `screenshot: only-on-failure`. Don't hand-roll logging/reporting; use `test.step()` in executors for long workflows.

## Layer Rules

Dependencies flow one way: `run.spec.ts / engine → executor → page object → BaseAction → Playwright`.

| Layer | Does | Never |
|-------|------|-------|
| Executor | Orchestrates via its page object, all `expect()` assertions, errors with `TC_ID` context | Raw locators, Sheets/loader access, hardcoded URLs/credentials |
| Page object | Locators, navigation, interactions (via BaseAction), UI readers | `expect()`, business rules, test branching, data access |
| BaseAction | Shared generic wrappers + app-wide widgets, used by 2+ pages or adding real value | `expect()`, page-specific knowledge, zero-value Playwright wrappers |
| Engine | Generic load/resolve/run | Anything module-specific |

Executor shape: `export const executor: ExecutorMap` with one key per `Function` value. Unknown `Function` values fail loudly in `run.spec.ts`. See [src/modules/login.executor.ts](src/modules/login.executor.ts) for the pattern.

Locator priority: `getByRole` > `getByLabel` > `getByPlaceholder` > `getByText` > `getByTestId` > `locator()` > CSS > XPath (last resort).

## Conventions

- Naming: module folders kebab-case (`initial-setup`), submodule folders match the `SubModule` column (`curriculumSetting`), page folders match the tab exactly, case-sensitive (`branchSetting`). Spelling is always `executor`.
- Stack is fixed (Playwright Test, googleapis, tsx, cross-env, dotenv, ESLint/Prettier). Forbidden: Selenium, Puppeteer, Cypress, axios, lodash, a second test runner. No new libraries without approval.
- Strict TypeScript; avoid `any`; always `await`; never swallow exceptions — add `TC_ID` context or let Playwright errors propagate (they carry locator context and trigger traces).
- No hardcoded URLs, credentials, sheet IDs, or timeouts — they live in `config/` and `core/constants.ts` / `.env`.

## When Adding a New Menu

1. Create `modules/<module>/<submodule>/<page>/` with `<page>.executor.ts` + `<page>.page.ts` — names copied exactly from the sheet. That's the whole registration.
2. Reuse BaseAction; add to it only for genuinely shared behavior. Check `action/`, `_shared/`, and neighboring pages before writing anything new.
3. Don't add flat files under `modules/` (login is the only one), ordering prefixes on folders (`[8]initial-setup` breaks resolution), or module-specific engine code.
4. Sync + commit `src/data/` before running or opening a PR.
