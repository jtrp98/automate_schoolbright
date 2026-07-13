# Automation Testing Framework - AI Agent Guide

This document defines the architecture, coding standards, development workflow, and AI generation rules for the Playwright + TypeScript automation testing framework.

The framework supports a large-scale school-management system consisting of 8 business modules and over 250 application menus. The guiding philosophy is: **one folder per menu, everything for that menu lives together, and the folder path IS the address used by the Google Sheet, the Loader, and the Registry.**

Structure in one line:

```text
src/modules/<module>/<submodule>/<page>/  →  <page>.executor.ts + <page>.page.ts
```

No separate `pages/` tree. No manual registration. The folder path is resolved by convention.

Two deliberate exceptions to the convention:

- **`login`** lives as a flat file pair at the modules root (`src/modules/login.executor.ts` + `src/modules/login.page.ts`), not in a nested folder. It IS sheet-driven (tab `Login` in the `initial-setup` sheet) and the registry resolves it through a flat fallback. See Section 3.1.
- **Test cases and test data are synced to local disk before a run**, not read live from the Google Sheets API. This makes every change to test data visible as a git diff and keeps runs reproducible offline. See Section 4.1.

---

# 1. Architecture Overview

Core design principles:

- **Data-Driven Testing** — Test cases and test data are managed in Google Sheets (one test-case sheet + one test-data sheet per module).
- **Co-located Menu Folders** — Each menu owns one folder containing its executor and page object side by side. Easy to find, impossible to confuse.
- **Convention over Registration** — The engine resolves executors from the folder path (`module/submodule/page`). Nothing is registered by hand.
- **Page Object Model (POM)** — UI interactions are isolated from test logic.
- **BaseAction as the Central Action Layer** — Shared/complex interactions flow through one reusable class that grows over time.
- **Single Playwright Entrypoint** — `tests/run.spec.ts` turns every sheet row into a real Playwright `test()`, so all Playwright features (report, trace, retry) work natively.
- **TypeScript Strict Mode** — Strong typing throughout the project (`"strict": true`, ESM, `moduleResolution: "Bundler"`).

## Overall Execution Flow

```text
Google Sheets (per module: 1 test-case sheet [tab = page, row = test case]
                          + 1 test-data sheet [rows keyed by Data_ID])
        │
        ▼
scripts/sync-sheets.ts   npm run sync-sheets
                          pulls rows, resolves Data_ID → data,
                          writes src/data/<module>/<submodule>/<page>.json (committed)
        │
        ▼
engine/cli.ts        reads MODULE / SUBMODULE / PAGE / RUNMODE / ENV
                     (all optional — omit MODULE/PAGE to run everything synced)
        │
        ▼
engine/loader.ts     reads src/data/**.json → TestCase[]
                     (never calls the Sheets API at run time)
        │
        ▼
tests/run.spec.ts    one test() per TC_ID; runs login bypass first
                     for every page except Login itself
        │
        ▼
engine/registry.ts   resolves executor by convention:
                     modules/<module>/<submodule>/<page>/<page>.executor.ts
                     falls back to modules/<page>.executor.ts (login)
        │
        ▼
Executor             workflow + expect() assertions
        │
        ▼
Page Object          locators + UI interactions (same folder)
        │
        ▼
BaseAction           shared Playwright wrappers
        │
        ▼
Playwright
```

---

# 2. Technology Stack & Tools

All generated code must target this exact toolchain. Never introduce a new library without explicit approval.

| Tool | Purpose | Notes |
|------|---------|-------|
| **Node.js (LTS)** | Runtime | ESM project (`"type": "module"`) |
| **TypeScript (strict mode)** | Language | `"strict": true` in `tsconfig.json`, `noEmit` |
| **Playwright Test (`@playwright/test`)** | Test runner + browser automation | The ONLY test runner; entry = `tests/run.spec.ts` |
| **googleapis** | Google Sheets API | Used only via `connectors/google-sheet.client.ts` from the sync script — never at test run time |
| **tsx** | Run the sync script | `npm run sync-sheets` |
| **dotenv** | Environment variables (`.env`) | Loaded only in `config/environment.ts` |
| **cross-env** | Set env vars in npm scripts on Windows | Used by `test:smoke` / `test:full` |
| **ESLint + Prettier** | Lint & format | Must pass before commit |
| **Playwright HTML Reporter + trace** | Reporting | Configured in `playwright.config.ts`, never hand-rolled |

Forbidden: Selenium, Puppeteer, Cypress, axios (use Playwright `request`), lodash, a second test runner.

## Playwright Config (`playwright.config.ts`)

Fixed run profile — do not override per test:

- `fullyParallel: false`, `workers: 1` — tests run sequentially (shared school data, one session)
- Reporters: `list` + `html` (`open: "never"`)
- `screenshot: "only-on-failure"`, `trace: "retain-on-failure"`
- `locale: "th-TH"`, `timezoneId: "Asia/Bangkok"`, `viewport: 1920×1080`, desktop Chrome user agent

---

# 3. Project Structure

Actual tree (menus grow over time; `initial-setup` is the first implemented module):

```text
src/
├── action/
│     baseaction.ts              # Central action layer (shared, grows over time)
│
├── config/
│     environment.ts             # .env loading, per-module sheet IDs, SYSTEM_URL/ACADEMIC_URL, Urls
│
├── connectors/
│     google-sheet.client.ts     # Google Sheets API access — used only by the sync script
│
├── core/
│     types.ts                   # TestCase, ExecutorMap, RunMode, shared contracts
│     constants.ts               # Sheet columns, module list, run modes, DATA_DIR, timeouts
│
├── engine/
│     cli.ts                     # Parse MODULE / SUBMODULE / PAGE / RUNMODE / ENV (all optional)
│     loader.ts                  # Reads src/data/**.json → TestCase[] (fully generic)
│     registry.ts                # Convention-based executor resolution (dynamic import + flat fallback)
│     runner.ts                  # Execution helpers shared by run.spec.ts (screenshotName)
│
├── data/                        # Synced from Google Sheets — committed, never hand-edited
│     initial-setup/
│           Login/Login.json
│           schoolSetting/schoolsetting.json
│           ...
│
└── modules/                     # THE single source tree for menu code
      login.executor.ts          # flat pair: login workflow (sheet-driven)
      login.page.ts              # flat pair: login page object (also used by run.spec.ts for bypass)
      initial-setup/
            curriculumSetting/
                  yearlist/          yearlist.executor.ts + yearlist.page.ts
                  classSetting/      classSetting.executor.ts + classSetting.page.ts
                  branchSetting/     branchSetting.executor.ts + branchSetting.page.ts
            personalEmployeeSetting/
                  classmember/  empSigner/  permission/  timeiosettings/
            schoolSetting/
                  schoolprofile/  schoolsetting/  roomlist/  holidaysettings/
      personal-info/  academic/  student-affairs/  general-admin/
      accounting/     store/     report/           (added as menus are implemented)

tests/
      run.spec.ts                # Single Playwright entrypoint: local test data → test()

scripts/
      sync-sheets.ts             # Pulls all configured sheets → src/data/**.json (run before testing)

credentials/
      google-service-account.json  # Service account for the Sheets API (never committed content changes)
```

## Structure Rules

Every menu = exactly one folder with exactly two files:

```text
src/modules/<module>/<submodule>/<page>/<page>.executor.ts
src/modules/<module>/<submodule>/<page>/<page>.page.ts
```

Example:

```text
src/modules/initial-setup/schoolSetting/schoolsetting/schoolsetting.executor.ts
src/modules/initial-setup/schoolSetting/schoolsetting/schoolsetting.page.ts
```

- Folder names must match the Google Sheet **byte-for-byte** (module = sheet module name, submodule = `SubModule` column value, page = tab name), because the registry resolves executors from this path. No prefixes, no suffixes, no `[1]`-style ordering numbers — a mismatch breaks resolution.
- Case follows the sheet, not a forced convention: submodules are camelCase (`schoolSetting`, `curriculumSetting`), pages are usually lowercase (`schoolsetting`, `yearlist`) but may be camelCase when the tab is (`branchSetting`, `classSetting`, `empSigner`).
- If a page grows large, extra files are allowed inside its folder (e.g. `schoolsetting.locators.ts`), but the executor and page file names never change.
- Shared page fragments used by several menus in the same submodule may live in a `_shared/` folder at the submodule level. Never share across modules through `modules/` — cross-module shared behavior belongs in `action/`.
- Spelling is always `executor` (never `excecutor`).

Mapping between folders, Google Sheets, and execution:

| Level | Folder | Google Sheet | Run parameter |
|-------|--------|--------------|---------------|
| Module | `modules/initial-setup/` | Sheet pair for `initial-setup` | `MODULE=initial-setup` |
| SubModule | `schoolSetting/` | Column `SubModule` | `SUBMODULE=schoolSetting` |
| Page | `schoolsetting/` | Sheet **tab** `schoolsetting` | `PAGE=schoolsetting` |

## 3.1 Login — Flat File Pair at the Modules Root

Login is a sheet-driven menu like any other (test cases live in the `initial-setup` test-case sheet, tab `Login`, `SubModule = Login`), but its code lives flat at the modules root instead of a nested folder:

```text
src/modules/login.executor.ts    # executor: { Login } workflow — asserts success/failure per row
src/modules/login.page.ts        # LoginPage: login(), loginBypass(), waitForDashboard(), isLoggedIn()
```

The registry finds it through its **flat fallback**: when `modules/<module>/<submodule>/<page>/<page>.executor` cannot be imported, it tries `modules/<page-lowercased>.executor` (Section 5).

Login plays two roles:

1. **A tested menu** — the `Login` workflow in `login.executor.ts` covers success, wrong-password (asserts the modal message), and bypass rows from the sheet.
2. **Session setup for every other test** — there is no shared `storageState`/globalSetup. `tests/run.spec.ts` calls `LoginPage.loginBypass()` (navigates to the `BYPASS` URL from `.env`) before running any workflow whose page is not Login itself.

Do not move login into a `modules/login/login/…` folder pair and do not add other menus as flat files — login is the only flat pair, kept that way so `run.spec.ts` can import `LoginPage` directly for the bypass step.

---

# 4. Google Sheet Structure

Each of the **8 business modules** has a **pair of Google Sheet files** — one for test cases, one for test data:

```text
personal-info    academic    student-affairs    general-admin
accounting       store       report             initial-setup
```

Sheet IDs come from `.env` (see `.env.example`), one pair per module:

```text
<MODULE>_TESTCASE_SHEET_ID    e.g. INITIAL_SETUP_TESTCASE_SHEET_ID
<MODULE>_TESTDATA_SHEET_ID    e.g. INITIAL_SETUP_TESTDATA_SHEET_ID
```

A module whose IDs are not configured is silently skipped by the sync — modules go live one pair at a time.

Inside a **test-case sheet**:

- Each **tab** = one page / menu (e.g. tab `schoolsetting`, tab `Login`)
- Each **row** = one test case

Inside a **test-data sheet**:

- Any number of tabs, any tab names — all rows across all tabs are merged into one module-wide `Data_ID → data` map
- Each row = one data set; every column except `Data_ID` becomes a key in the test case's `data` object

## Required Columns (every test-case tab)

| Column | Type | Description |
|--------|------|-------------|
| `TC_ID` | string | Unique test case ID within the tab (e.g. `TC_0001`) |
| `Expected` | string | Expected result / assertion description (used in the test title) |
| `Function` | string | Workflow key exported by the executor (e.g. `Login`, `UpdateSetting`) |
| `Mode` | string | `normal` / `smoke` / `regression` / `full` (case-insensitive in the sheet, stored lowercase) |
| `Data_ID` | string | Key into the module's test-data map; `-` means "no data" → `data: {}` |
| `Enable` | boolean | `TRUE` = run, anything else = `test.skip` (still visible in the report) |
| `SubModule` | string | SubModule name — must match the folder exactly (e.g. `schoolSetting`). May be blank |

## Sheet Rules

- Column names, the module list, run modes, and `DATA_DIR` live in `core/constants.ts`; sheet IDs live in `.env` via `config/environment.ts` — never hardcoded elsewhere.
- `Enable = FALSE` rows become `test.skip` — handled in `run.spec.ts`, never inside executors.
- `Mode` filtering is applied by the Loader (`RUNMODE`), never inside executors. `RUNMODE=full` runs **all** rows regardless of `Mode`; any other value runs only rows with that exact mode.

## 4.1 Sync to Local — Two Sources of Truth

Google Sheets and the repo each own a different job:

| | Owns | Used by |
|---|---|---|
| **Google Sheets** | Editing test cases/data — QA's working copy | Humans, via `npm run sync-sheets` |
| **`src/data/**.json`** | What actually runs — committed, versioned | The Loader, at run time |

Rules:

- Run `npm run sync-sheets` (`scripts/sync-sheets.ts`) to pull every configured module pair into `src/data/<module>/<submodule>/<page>.json`. Commit the result. (`npm test` runs the sync automatically before `playwright test`.)
- `Data_ID` is looked up module-wide, not per page: the sync reads every tab of the module's test-data sheet into one `Data_ID → data` map. A `Data_ID` duplicated across two data tabs in the same module fails the sync. `Data_ID = "-"` resolves to an empty `data` object.
- Rows are **grouped by `SubModule`** and written one file per (submodule, page). Rows with a blank `SubModule` are written to `src/data/<module>/<page>.json` at the module root; the Loader reads both locations.
- Each JSON row is a complete, resolved `TestCase` — including `module`, `page`, and the resolved `data` object — so the Loader never does a second lookup.
- **Test runs never call the Google Sheets API.** `engine/loader.ts` only reads local JSON. This makes runs fast, offline-capable, and CI-safe (no API quota/flakiness).
- Because the data is committed, **`git diff` on `src/data/` shows exactly what test cases or test data changed** — reviewers see data changes the same way they see code changes, and a bad sheet edit is caught in code review before it ever runs.
- Never hand-edit files under `src/data/` — fix the sheet, then re-sync.
- The sync validates every row while pulling — required columns present (`SubModule` optional), `Mode` is a valid `RunMode`, `TC_ID` unique per tab, `Data_ID` resolvable — and fails loudly on bad data.

```bash
npm run sync-sheets           # pull all configured sheet pairs → src/data/**.json
git diff src/data             # review exactly what changed before running
npx playwright test           # run.spec.ts reads local data only
```

---

# 5. Layer Responsibilities

## Engine (`engine/`)

Fully generic — must never contain module-specific logic.

- `cli.ts` — reads run parameters from env vars into `RunParams`. `MODULE`, `SUBMODULE`, `PAGE` are **optional** (omit to widen the run); `RUNMODE` defaults to `normal`, `ENV` defaults to `dev`.
- `loader.ts` — reads `src/data/**.json` and returns `TestCase[]`:
  - No `MODULE` → all modules in `SHEET_MODULES`; no `SUBMODULE` → module root + every submodule folder; no `PAGE` → every JSON file found.
  - Filters by `subModule` (when given) and by `runMode` (`full` = no filter).
  - Throws with a "Run npm run sync-sheets first" message when nothing matches.
  - Never reads the Sheets API; never grows `loadAcademic()`-style functions.
- `registry.ts` — resolves the executor **by convention** with a dynamic import, then a flat fallback (this is how login resolves):

```ts
// engine/registry.ts — actual resolution order
const nestedPath = `../modules/${module}/${submodule}/${page}/${page}.executor`;
// on failure:
const flatPath = `../modules/${page.toLowerCase()}.executor`;
// both failing → error naming both attempted paths
```

The imported module must export `executor` (an `ExecutorMap`) or resolution fails loudly. No manual registration files — creating the folder + executor file IS the registration. This is what keeps 250 menus maintainable.

- `runner.ts` — shared helpers for `run.spec.ts` (currently `screenshotName(tc, suffix)`).

## Entrypoint (`tests/run.spec.ts`)

The only spec file. It:

- Reads run parameters via `cli.ts` and loads `TestCase[]` via `loader.ts` at module top level (top-level `await`)
- Generates **one `test()` per row**, titled `TC_ID: Expected`, tagged with `@<Mode>`
- Skips disabled rows with `test.skip(!tc.enable, "Disabled in sheet")`
- Resolves the executor via `registry.ts` using **the test case's own** `module`/`subModule`/`page` (not the CLI params — a wide run spans many pages)
- **Logs in first for every page except Login itself**: if the case is not the Login page (`initial-setup` / `Login` / `Login`), it runs `LoginPage.loginBypass()` + `waitForLoadState()` before invoking the workflow — there is no shared storageState or globalSetup
- Calls the workflow matching `Function`, failing loudly on unknown values

```ts
// tests/run.spec.ts (shape)
const params = getRunParams();
const cases = await loadTestCases(params);

for (const tc of cases) {
    test(`${tc.tcId}: ${tc.expected}`, { tag: `@${tc.mode}` }, async ({ page }) => {

        test.skip(!tc.enable, "Disabled in sheet");

        const executor = await resolveExecutor(tc.module, tc.subModule, tc.page);
        const workflow = executor[tc.function];

        if (!workflow) {
            throw new Error(`Unknown Function "${tc.function}" in ${tc.tcId}`);
        }

        const action = new BaseAction(page);

        if (!isLoginPage(tc)) {
            await new LoginPage(page, action).loginBypass();
            await action.waitForLoadState();
        }

        await workflow({ page, action }, tc);

    });
}
```

## Executors (`modules/**/<page>.executor.ts`)

An executor exports a typed map of workflows, keyed by the `Function` column. Executors contain ALL test logic and assertions.

Responsibilities:

- Orchestrate the workflow using the page object in the same folder
- Cast `tc.data` to a local data interface (all sheet values are strings — convert `"true"`/`"false"` etc. explicitly)
- Perform assertions with `expect()` against `Expected` / `data`
- Throw meaningful errors with `TC_ID` context (use the `expect(..., message)` second argument)

Only executors may use: `expect()`, business rules, success/failure decisions.

Must NOT contain: raw locators (belong in the page object), Sheet API calls, hardcoded credentials/URLs.

## Page Objects (`modules/**/<page>.page.ts`)

Represent the menu in the same folder.

Responsibilities:

- Define locators as `private readonly` fields initialized in the constructor; page paths as file-top constants
- Navigate via `action.gotoSystem(PATH)` / `action.gotoAcademic(PATH)` (never `page.goto` with a hardcoded base URL)
- Perform UI interactions (through BaseAction whenever possible)
- Return UI values/state when the executor needs them (e.g. `isScanOutEnabled()`, `hasResultMessage()`)

NOT ALLOWED: `expect()` / assertions, test branching, business rules, success/failure decisions, Sheet/data access.

## BaseAction (`action/baseaction.ts`)

The central, shared action layer — the ONE place for cross-cutting interaction logic, expected to grow over time.

Current surface:

- Navigation: `gotoSystem(path)`, `gotoAcademic(path)` — prefix `SYSTEM_URL` / `ACADEMIC_URL` from config
- Wrappers: `click`, `clickByText` (button by role/name), `fill`, `fillByText` (textbox by role/name), `check`, `select`, `upload`, `clear`, `press`, `waitFor`
- State: `waitForLoadState()` (network idle), `getText`, `isVisible`
- Shared widgets: `getModalMessage(selector?, timeout?)` / `hasModalMessage(text, selector?)` — default selector `#modal-content`; pages using other modal libraries pass their own selector (e.g. SweetAlert2 `.swal2-popup`)

Rules to keep BaseAction healthy:

- **No assertions, no `expect()`, no business logic — ever.**
- Add a method only when the behavior is (a) shared by 2+ pages, or (b) adds real value on top of Playwright (retry, logging, widget handling). Do not wrap a Playwright call that adds nothing.
- Methods stay generic — accept `Locator`/values, never know about specific pages or test data.
- New shared interactions (e.g. `selectFromCustomDropdown()`, `handleConfirmDialog()`) go here, not into individual page objects.
- If a group of methods grows large (e.g. grid/table handling), split it into a focused helper in `action/` (e.g. `grid.action.ts`) and compose it into BaseAction.

## Core (`core/`)

Types, constants, shared contracts only. No logic, no Playwright code (types may import Playwright types).

## Config (`config/`)

`environment.ts` is the only file that loads `.env`. It exposes:

- `Environment` — `ENV` (dev/uat/prod), `SYSTEM_URL`, `ACADEMIC_URL`, `BYPASS`, `GOOGLE_SERVICE_ACCOUNT_PATH`, and `getModuleSheetIds(module)` returning the module's `{ testCaseSheetId, testDataSheetId }` pair
- `Urls` — app route constants (`dashboard: "/AdminMain.aspx"`, `loginBypass` from `BYPASS`)

Credentials and sheet IDs come from `.env` / CI secrets — never in code. The Google service account JSON lives at `credentials/google-service-account.json` (path configurable via `GOOGLE_SERVICE_ACCOUNT_PATH`).

## Connectors (`connectors/`)

External service access only — `google-sheet.client.ts` exposes `listSheetTitles()` and `getSheetValues()` over a lazily-created read-only Sheets client. No business rules, no assertions. Never imported by `engine/loader.ts`, executors, or page objects; only `scripts/sync-sheets.ts` uses it.

## Sync Script (`scripts/sync-sheets.ts`)

The only code in the whole project allowed to call the Google Sheets API (via the connector).

- Iterates `SHEET_MODULES`, skipping modules whose sheet IDs are not configured in `.env`
- Reads all tabs of the module's test-data sheet into one `Data_ID → data` map (duplicate `Data_ID` across tabs = hard error)
- Reads every tab of the test-case sheet; validates each row (required columns, valid `Mode`, unique `TC_ID` per tab, resolvable `Data_ID`)
- Groups rows by `SubModule` and writes `src/data/<module>[/<subModule>]/<page>.json`
- Fails loudly on invalid rows (`process.exitCode = 1`) — never writes partial output for a bad tab
- Stays generic: driven by `SHEET_MODULES` in `core/constants.ts`, never `syncAcademic()`-style per-module functions

Run it before testing, and whenever the sheet changes: `npm run sync-sheets` (or just `npm test`, which syncs first).

---

# 6. Dependency Rules

Dependencies must always flow downward:

```text
run.spec.ts / Engine
        ↓
    Executor
        ↓
   Page Object
        ↓
    BaseAction
        ↓
    Playwright
```

(`run.spec.ts` additionally imports `LoginPage` directly for the session-bypass step — the one sanctioned exception.)

Forbidden:

- Page → Executor
- Page → Sheet / Loader / data
- Executor → Loader or Sheet API (executors receive `TestCase`, they never fetch)
- Executor → runner/engine internals
- BaseAction → Executor or Page Object
- BaseAction → expect()
- Loader → connectors/ or the Sheets API (Loader reads only local `src/data/**.json`)
- Anything except `scripts/sync-sheets.ts` → `connectors/`

---

# 7. Executor Pattern

Standard shape of every executor. Follow it exactly.

```ts
// modules/initial-setup/schoolSetting/schoolsetting/schoolsetting.executor.ts

import { expect } from "@playwright/test";
import type { ExecutorMap } from "../../../../core/types";
import { SchoolsettingPage } from "./schoolsetting.page";

interface SchoolSettingData {
    ScanOut?: string;
    ClassNameDisable?: string;
    expected?: string;
}

export const executor: ExecutorMap = {

    async UpdateSetting(ctx, tc) {

        const { ScanOut, ClassNameDisable, expected } = tc.data as SchoolSettingData;
        const schoolsettingPage = new SchoolsettingPage(ctx.page, ctx.action);

        await schoolsettingPage.goto();

        if (ScanOut) {
            await schoolsettingPage.setScanOut(ScanOut.toLowerCase() === "true");
        }

        if (ClassNameDisable) {
            await schoolsettingPage.setClassNameDisable(ClassNameDisable.toLowerCase() === "true");
        }

        await schoolsettingPage.submit();

        expect(
            await schoolsettingPage.hasResultMessage(expected ?? ""),
            `${tc.tcId}: expected result message "${expected}"`
        ).toBe(true);

    }

};
```

Key points:

- Export name is always `executor`, typed as `ExecutorMap`.
- Each key = one value of the `Function` column, matched case-sensitively (e.g. `Login`, `UpdateSetting`). Unknown values fail loudly in `run.spec.ts`.
- Declare a local `interface` for the shape of `tc.data` and cast once — all sheet values arrive as strings.
- One workflow = one focused function. Shared steps inside a menu become private helpers in the same file.
- No `goto`-to-login or bypass calls inside workflows — `run.spec.ts` already authenticated the session.

---

# 8. Page Object Pattern

```ts
// modules/initial-setup/schoolSetting/schoolsetting/schoolsetting.page.ts

import type { Locator, Page } from "@playwright/test";
import type { BaseAction } from "../../../../action/baseaction";

const SCHOOLSETTING_PATH = "/schoolprofile/schoolsetting.aspx";

export class SchoolsettingPage {

    private readonly scanOutInput: Locator;
    private readonly scanOutSwitch: Locator;
    private readonly submitButton: Locator;

    constructor(
        private readonly page: Page,
        private readonly action: BaseAction
    ) {
        this.scanOutInput = page.locator("#behavior_show_minus_sign");
        this.scanOutSwitch = page.locator("#behavior_show_minus_sign + .el-switch-style");
        this.submitButton = page.locator("#btnSubmit");
    }

    async goto(): Promise<void> {
        await this.action.gotoSystem(SCHOOLSETTING_PATH);
        await this.action.waitForLoadState();
    }

    async isScanOutEnabled(): Promise<boolean> {
        return this.scanOutInput.isChecked();
    }

    async setScanOut(enabled: boolean): Promise<void> {

        if (await this.isScanOutEnabled() !== enabled) {
            await this.action.click(this.scanOutSwitch);
        }

    }

    async submit(): Promise<void> {
        await this.action.click(this.submitButton);
    }

}
```

Page objects stay small: locators + interactions + simple readers. Anything shared across pages moves down into BaseAction.

---

# 9. Locator Priority

Prefer user-facing locators when the DOM allows it:

1. getByRole()
2. getByLabel()
3. getByPlaceholder()
4. getByText()
5. getByTestId()
6. locator() with a stable element ID (`#btnSubmit`)
7. CSS Selector (structural)
8. XPath (last resort)

The application under test is a legacy ASP.NET (`.aspx`) app with a Thai UI. Role/name locators work for standard controls (see `fillByText` / `clickByText` with Thai labels), but many widgets (custom switches, SweetAlert2 modals) only expose stable element IDs — `page.locator("#id")` is acceptable there. Avoid structural CSS chains and XPath when anything more semantic exists.

---

# 10. Test Data Model

```ts
// core/types.ts

export type RunMode = "normal" | "smoke" | "regression" | "full";

export interface TestCase {
    tcId: string;                       // TC_ID
    expected: string;                   // Expected
    function: string;                   // Function (key in ExecutorMap)
    mode: RunMode;                      // Mode (lowercased by the sync)
    dataId: string;                     // Data_ID ("-" = no data)
    enable: boolean;                    // Enable
    subModule: string;                  // SubModule ("" when blank in the sheet)
    module: string;                     // Stamped by the sync from the sheet module
    page: string;                       // Stamped by the sync from the sheet tab
    data: Record<string, unknown>;      // Resolved from Data_ID by the sync
}

export interface ExecutionContext {
    page: Page;
    action: BaseAction;
}

export type Workflow = (ctx: ExecutionContext, tc: TestCase) => Promise<void>;

export type ExecutorMap = Record<string, Workflow>;
```

Workflows return `void` — success/failure is determined by whether `expect()` throws, exactly like a normal Playwright test. No custom `ExecutionResult`.

`module` and `page` are written into the JSON by the sync script; the Loader backfills them from the file path for older files. They let one wide run resolve a different executor per row.

---

# 11. Running Tests

```bash
# Everything that's synced (all modules, all pages, Mode = normal)
npx playwright test

# One page
$env:MODULE="initial-setup"; $env:SUBMODULE="schoolSetting"; $env:PAGE="schoolsetting"; npx playwright test
# (POSIX: MODULE=initial-setup SUBMODULE=schoolSetting PAGE=schoolsetting npx playwright test)

# Everything, all modes
npx cross-env RUNMODE=full playwright test

# Sync + run in one step
npm test
```

npm scripts (actual `package.json`):

| Script | Command |
|--------|---------|
| `sync-sheets` | `tsx scripts/sync-sheets.ts` |
| `test` | `tsx scripts/sync-sheets.ts && playwright test` |
| `test:headed` | `playwright test --headed` |
| `test:smoke` / `test:smoke:headed` | `cross-env RUNMODE=smoke playwright test [--headed]` |
| `test:full` / `test:full:headed` | `cross-env RUNMODE=full playwright test [--headed]` |
| `report` | `playwright show-report` |

`run.spec.ts` reads only local `src/data/**.json` — make sure the sync ran (manually or via `npm test`) before `npx playwright test`.

Parameters (all read from env vars by `engine/cli.ts`):

| Parameter | Values | Default | Maps to |
|-----------|--------|---------|---------|
| `MODULE` | one of the 8 module names | *(all modules)* | data folder + `modules/<module>/` |
| `SUBMODULE` | e.g. `schoolSetting` | *(all submodules)* | `SubModule` column + folder |
| `PAGE` | e.g. `schoolsetting` | *(all pages)* | Sheet tab + folder |
| `RUNMODE` | normal / smoke / regression / full | `normal` | `Mode` filter; `full` runs every mode |
| `ENV` | dev / uat / prod | `dev` | `config/environment.ts` |

---

# 12. Coding Standards

## TypeScript

Strict typing always. Prefer `interface`, `type`, `Record`, generics, `unknown`, `Readonly`. Avoid `any` unless absolutely necessary. The project is ESM (`"type": "module"`) with top-level `await` available in `run.spec.ts`.

## Async

Always await asynchronous operations.

```ts
// Correct
await action.fill(locator, value);

// Incorrect
action.fill(locator, value);
```

## Error Handling

Never swallow exceptions. Add `TC_ID` context to assertions via the `expect` message argument:

```ts
expect(
    await schoolsettingPage.hasResultMessage(expected),
    `${tc.tcId}: expected result message "${expected}"`
).toBe(true);
```

In most cases, let Playwright errors propagate naturally — they already include locator context and trigger screenshots/traces.

## Naming

```text
schoolsetting/                   # page folder — matches the sheet tab byte-for-byte
schoolsetting.executor.ts        # workflows + assertions
schoolsetting.page.ts            # page object
schoolsetting.locators.ts        # optional, only if the page is large
_shared/                         # optional shared fragments within a submodule
baseaction.ts                    # action layer
grid.action.ts                   # focused helper composed into BaseAction
```

- Module folders: kebab-case, exactly matching the module list (`initial-setup`, `personal-info`).
- SubModule folders: camelCase, exactly matching the `SubModule` column (`schoolSetting`).
- Page folders/files: exactly matching the sheet tab (`schoolsetting`, `branchSetting`).
- Page classes: `<Page>Page` (`SchoolsettingPage`, `LoginPage`).
- Spelling is always `executor`.

## Constants

Never hardcode base URLs, credentials, sheet IDs, or environment names — they live in `.env` via `config/environment.ts`. Column names, module list, run modes, and timeouts live in `core/constants.ts`. App route paths live as constants at the top of the page object (or in `config/environment.ts` `Urls` when shared, like the dashboard).

---

# 13. Reporting & Logging

Use Playwright's built-ins — do not build custom logging/reporting infrastructure:

- `list` + HTML reporter, `trace: "retain-on-failure"`, `screenshot: "only-on-failure"` in `playwright.config.ts`
- `test.step()` inside executors to structure long workflows in the report
- BaseAction may emit framework-level interaction logs (one line per action) — nothing else logs

---

# 14. DOs

- Keep everything for a menu inside its one folder: `modules/<module>/<submodule>/<page>/`.
- Keep folder names byte-for-byte identical to the sheet (module / SubModule / tab) — the registry depends on it.
- Keep `login` as the flat pair `modules/login.executor.ts` + `modules/login.page.ts` — the only flat-file menu.
- Sync sheets to local JSON (`npm run sync-sheets`) and commit the result before running or opening a PR.
- Review `git diff src/data` as part of code review — that diff IS the test-data change log.
- One `test()` per sheet row, titled with `TC_ID: Expected`.
- Put assertions in executors, locators in page objects, shared interactions in BaseAction.
- Navigate through `action.gotoSystem()` / `action.gotoAcademic()` so base URLs stay in config.
- Cast `tc.data` to a local typed interface in each executor; remember sheet values are strings.
- Grow BaseAction deliberately: shared, generic, assertion-free.
- Keep the engine 100% generic.
- Fail loudly on unknown `Function` values, unresolvable paths, or invalid rows during sync.
- Use strict TypeScript and meaningful error messages.

# 15. DON'Ts

Do NOT:

- Create a separate `pages/` tree — the page object lives next to its executor.
- Add more flat files to `modules/` — every menu except login gets a nested folder.
- Add manual registration files — resolution is by folder convention (plus the flat fallback for login).
- Add ordering prefixes or decorations to module folder names (`[8]initial-setup` breaks resolution — use `initial-setup`).
- Call the Google Sheets API at test run time, or from executors, page objects, or `engine/loader.ts`.
- Hand-edit files under `src/data/` — fix the sheet, then re-sync.
- Re-implement login/bypass inside executors — `run.spec.ts` handles the session.
- Put `expect()` in page objects or BaseAction.
- Put raw locators in executors (except trivial assertion targets like a toast/alert).
- Add module-specific logic to `engine/`.
- Wrap Playwright methods in BaseAction without added value.
- Hardcode URLs, credentials, sheet names, or timeouts.
- Use `any` unnecessarily, ignore TypeScript errors, or swallow exceptions.
- Use XPath unless absolutely necessary.

---

# 16. AI Code Generation Rules

When generating code for a new menu, AI must:

- Create exactly one folder with two files: `modules/<module>/<submodule>/<page>/<page>.executor.ts` and `<page>.page.ts`. No registration step.
- Treat `login` as the exception: the existing flat pair at `modules/login.executor.ts` / `modules/login.page.ts` — never split into a folder or duplicated.
- Name the folder and files exactly after the sheet tab and the `SubModule` column (byte-for-byte, including case).
- Follow the Executor Pattern (Section 7): export `executor: ExecutorMap` with one key per `Function` value in the sheet, and a local data interface for `tc.data`.
- Follow the Page Object Pattern (Section 8): locator fields in the constructor, path constant at the top, navigation via `action.gotoSystem()`.
- Assume the session is already authenticated by `run.spec.ts` — never add login steps to a workflow.
- Assume test data comes from `src/data/**.json` (already synced) — never write code that calls the Sheets API outside `scripts/sync-sheets.ts`.
- Reuse existing BaseAction methods (including `hasModalMessage` for result modals); propose new BaseAction methods only for genuinely shared behavior.
- Never duplicate existing logic — check `action/`, `_shared/`, and neighboring pages first.
- Use only the tools in Section 2.
- Follow SOLID, prefer composition over inheritance, keep methods short and single-purpose.
- Produce complete, production-ready code — no placeholders or TODOs unless explicitly requested.
- Maintain strict typing throughout.

---

# 17. Final Principle

When in doubt:

- One menu = one folder = executor + page, side by side. `login` is the one deliberate exception — a flat pair at the modules root.
- The folder path is the contract: module = sheet pair, submodule = `SubModule` column, page = sheet tab.
- Sheets are for editing; `src/data/**.json` is for running — sync between them, never skip the sync, never hand-edit the JSON.
- Keep the engine generic; keep assertions in executors; keep locators in page objects; keep shared interactions in BaseAction.
- Let Playwright Test do the running, retrying, and reporting.
- Prefer convention over registration, and deleting a layer over adding one.
