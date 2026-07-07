# Automation Testing Framework - AI Agent Guide

This document defines the architecture, coding standards, development workflow, and AI generation rules for the Playwright + TypeScript automation testing framework.

The framework supports a large-scale system consisting of 9 core modules and over 250 application menus. The guiding philosophy is: **one folder per menu, everything for that menu lives together, and the folder path IS the address used by the Google Sheet, the Loader, and the Registry.**

Structure in one line:

```text
modules/<module>/<submodule>/<page>/  →  <page>.executor.ts + <page>.page.ts
```

No separate `pages/` tree. No manual registration. The folder path is resolved by convention.

Two deliberate exceptions to the convention:

- **`login`** is a single file, not a folder — it is shared infrastructure used to set up every other menu's session, not a sheet-driven menu with its own `Function` workflows. See Section 3.1.
- **Test cases and test data are synced to local disk before a run**, not read live from the Google Sheets API. This makes every change to test data visible as a git diff and keeps runs reproducible offline. See Section 4.1.

---

# 1. Architecture Overview

Core design principles:

- **Data-Driven Testing** — Test cases and test data are managed in Google Sheets (8 files, one per module).
- **Co-located Menu Folders** — Each menu owns one folder containing its executor and page object side by side. Easy to find, impossible to confuse.
- **Convention over Registration** — The engine resolves executors from the folder path (`module/submodule/page`). Nothing is registered by hand.
- **Page Object Model (POM)** — UI interactions are isolated from test logic.
- **BaseAction as the Central Action Layer** — Shared/complex interactions flow through one reusable class that grows over time.
- **Single Playwright Entrypoint** — `tests/run.spec.ts` turns every sheet row into a real Playwright `test()`, so all Playwright features (report, trace, retry, parallel) work natively.
- **TypeScript Strict Mode** — Strong typing throughout the project.

## Overall Execution Flow

```text
Google Sheets (8 files: 1 per module, tab = page, row = test case)
        │
        ▼
scripts/sync-sheets.ts   npm run sync-sheets
                          pulls rows + data → data/*.json (committed to repo)
        │
        ▼
engine/cli.ts        reads MODULE / SUBMODULE / PAGE / RUNMODE / ENV
        │
        ▼
engine/loader.ts     reads data/<module>/<submodule>/<page>.json → TestCase[]
                     (never calls the Sheets API at run time)
        │
        ▼
tests/run.spec.ts    one test() per TC_ID
        │
        ▼
engine/registry.ts   resolves executor by convention:
                     modules/<module>/<submodule>/<page>/<page>.executor.ts
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
| **Node.js (LTS)** | Runtime | LTS features only |
| **TypeScript (strict mode)** | Language | `"strict": true` in `tsconfig.json` |
| **Playwright Test (`@playwright/test`)** | Test runner + browser automation | The ONLY test runner; entry = `tests/run.spec.ts` |
| **googleapis** | Google Sheets API | Used only inside `scripts/sync-sheets.ts` — never at test run time |
| **tsx / ts-node** | Run the sync script | `npm run sync-sheets` |
| **dotenv** | Environment variables (`.env`) | Loaded only in `config/environment.ts` |
| **ESLint + Prettier** | Lint & format | Must pass before commit |
| **Playwright HTML Reporter + trace** | Reporting | Configured in `playwright.config.ts`, never hand-rolled |

Forbidden: Selenium, Puppeteer, Cypress, axios (use Playwright `request`), lodash, a second test runner.

---

# 3. Project Structure

```text
src/

├── action/
│     baseaction.ts              # Central action layer (shared, grows over time)
│
├── config/
│     environment.ts             # Base URLs, env selection (dev/uat/prod), .env loading
│
├── connectors/
│     google-sheet.client.ts     # Google Sheets API access — used only by the sync script
│
├── core/
│     types.ts                   # TestCase, ExecutorMap, RunMode, shared contracts
│     constants.ts               # Sheet IDs, column names, timeouts
│
├── engine/
│     cli.ts                     # Parse MODULE / SUBMODULE / PAGE / RUNMODE / ENV
│     loader.ts                  # Reads local data/*.json → TestCase[] (fully generic)
│     registry.ts                # Convention-based executor resolution (dynamic import)
│     runner.ts                  # Execution helpers shared by run.spec.ts
│
├── data/                        # Synced from Google Sheets — committed, never hand-edited
│     personal-info/
│     │     studentInfo/
│     │           studentlist.json
│     academic/
│     ...
│
├── modules/                     # THE single source tree for menu code
│     login/
│     │     login.ts             # single file: page interactions + login workflow
│     personal-info/
│     │     studentInfo/
│     │     │     studentlist/
│     │     │     │     studentlist.executor.ts
│     │     │     │     studentlist.page.ts
│     │     │     studentprofile/
│     │     │           studentprofile.executor.ts
│     │     │           studentprofile.page.ts
│     academic/
│     student-affairs/
│     general-admin/
│     accounting/
│     store/
│     report/
│     initial-setup/
│
├── utils/                       # Small pure helpers only (no Playwright, no business logic)
│
└── tests/
      run.spec.ts                # Single Playwright entrypoint: local test data → test()

scripts/
      sync-sheets.ts              # Pulls all 8 sheets → src/data/*.json (run before testing)
```

## Structure Rules

Every menu = exactly one folder with exactly two files:

```text
modules/<module>/<submodule>/<page>/<page>.executor.ts
modules/<module>/<submodule>/<page>/<page>.page.ts
```

Example:

```text
modules/personal-info/studentInfo/studentlist/studentlist.executor.ts
modules/personal-info/studentInfo/studentlist/studentlist.page.ts
```

- Folder names must match the Google Sheet **exactly** (module = sheet file name, submodule = `SubModule` column value, page = tab name), because the registry resolves executors from this path. No prefixes, no suffixes, no `[1]`-style ordering numbers — a mismatch breaks resolution.
- If a page grows large, extra files are allowed inside its folder (e.g. `studentlist.locators.ts`), but the executor and page file names never change.
- Shared page fragments used by several menus in the same submodule may live in a `_shared/` folder at the submodule level. Never share across modules through `modules/` — cross-module shared behavior belongs in `action/` or `utils/`.
- Spelling is always `executor` (never `excecutor`).

Mapping between folders, Google Sheets, and execution:

| Level | Folder | Google Sheet | Run parameter |
|-------|--------|--------------|---------------|
| Module | `modules/personal-info/` | Sheet **file** `personal-info` | `MODULE=personal-info` |
| SubModule | `studentInfo/` | Column `SubModule` | `SUBMODULE=studentInfo` |
| Page | `studentlist/` | Sheet **tab** `studentlist` | `PAGE=studentlist` |

## 3.1 Login — Single File, Not a Menu Folder

`login` is not driven by a sheet tab and has no `Function` map — it exists purely so other menus can start from an authenticated state. Keep it as one file:

```text
modules/login/login.ts
```

```ts
// modules/login/login.ts

import type { Page } from "@playwright/test";
import type { BaseAction } from "../../action/baseaction";

export class LoginPage {

    constructor(

        private readonly page: Page,
        private readonly action: BaseAction

    ) {}

    async goto() {
        await this.page.goto("/login");
    }

    async loginAs(username: string, password: string) {

        await this.action.fill(
            this.page.getByLabel("Username"), username
        );

        await this.action.fill(
            this.page.getByLabel("Password"), password
        );

        await this.action.click(
            this.page.getByRole("button", { name: "Sign in" })
        );

        await this.page.waitForURL(/dashboard/);

    }

}
```

Used from a Playwright fixture (e.g. `fixtures/auth.setup.ts`) to build `storageState` once per project, not re-run per menu. If login itself ever needs sheet-driven test cases (e.g. testing invalid credentials, lockout), those become a normal menu at `modules/login-tests/...` — do not overload `login.ts` with assertions or `Function` branching; it stays infrastructure only.

---

# 4. Google Sheet Structure

There are **8 Google Sheet files**, one per business module:

```text
personal-info
academic
student-affairs
general-admin
accounting
store
report
initial-setup
```

Inside each sheet file:

- Each **tab** = one page / menu (e.g. tab `studentlist`)
- Each **row** = one test case

## Required Columns (every tab)

| Column | Type | Description |
|--------|------|-------------|
| `TC_ID` | string | Unique test case ID (e.g. `PI-STU-001`) |
| `Expected` | string | Expected result / assertion description |
| `Function` | string | Workflow key exported by the executor (e.g. `search`, `create`, `delete`) |
| `Mode` | string | `normal` / `smoke` / `regression` / `full` |
| `Data_ID` | string | Reference key to the test data set for this case |
| `Enable` | boolean | `TRUE` = run, `FALSE` = skip |
| `SubModule` | string | SubModule name — must match the folder exactly (e.g. `studentInfo`) |

## Sheet Rules

- Sheet IDs, tab names, and column names live in `core/constants.ts` — never hardcoded elsewhere.
- `Enable = FALSE` rows become `test.skip` (still visible in the report as skipped) — handled in `run.spec.ts`, never inside executors.
- `Mode` filtering is applied by the engine (`RUNMODE`), never inside executors.

## 4.1 Sync to Local — Two Sources of Truth

Google Sheets and the repo each own a different job:

| | Owns | Used by |
|---|---|---|
| **Google Sheets** | Editing test cases/data — QA's working copy | Humans, via `npm run sync-sheets` |
| **`src/data/*.json`** | What actually runs — committed, versioned | The Loader, at run time |

Rules:

- Run `npm run sync-sheets` (`scripts/sync-sheets.ts`) to pull all 8 sheet files into `src/data/<module>/<submodule>/<page>.json`. Commit the result.
- The test-case tab and its test-data tab(s) are not required to share an exact name. The sync script matches every data tab whose title equals the page name or starts with `<page>_` (e.g. page `Login` matches data tab `Login_Data`; page `x` matches both `x_add_data` and `x_delete_data`) and merges their rows into one `Data_ID` lookup for that page. A `Data_ID` duplicated across matched data tabs fails the sync.
- **Test runs never call the Google Sheets API.** `engine/loader.ts` only reads local JSON. This makes runs fast, offline-capable, and CI-safe (no API quota/flakiness).
- Because the data is committed, **`git diff` on `src/data/` shows exactly what test cases or test data changed** between runs — this is the whole point: reviewers see data changes the same way they see code changes, and a bad edit in the sheet is caught in code review before it ever runs.
- Never hand-edit files under `src/data/` — fix the sheet, then re-sync. The sync script resolves `Data_ID` into a `data` object per row so the Loader never does a second lookup.
- The sync script validates every row while pulling (required columns present, `Mode` is a valid `RunMode`, `TC_ID` unique per tab) and fails loudly on bad data — never writes partial output.
- The Loader (`engine/loader.ts`) maps the local JSON rows to typed `TestCase[]` — executors never touch the Sheets API or `src/data/` directly, they only receive the resolved `TestCase`.

```bash
npm run sync-sheets           # pull all 8 sheets → src/data/*.json
git diff src/data             # review exactly what changed before running
npx playwright test           # run.spec.ts reads local data only
```

---

# 5. Layer Responsibilities

## Engine (`engine/`)

Fully generic — must never contain module-specific logic.

- `cli.ts` — parses run parameters (`MODULE`, `SUBMODULE`, `PAGE`, `RUNMODE`, `ENV`) from env vars / CLI.
- `loader.ts` — reads `src/data/<module>/<submodule>/<page>.json` and returns `TestCase[]`. Understands only module/submodule/page. Never reads the Sheets API, never create `loadAcademic()`-style functions.
- `registry.ts` — resolves the executor **by convention** with a dynamic import:

```ts
// engine/registry.ts
import type { ExecutorMap } from "../core/types";

export async function resolveExecutor(

    module: string,
    submodule: string,
    page: string

): Promise<ExecutorMap> {

    const path =
        `../modules/${module}/${submodule}/${page}/${page}.executor`;

    try {
        const mod = await import(path);

        if (!mod.executor) {
            throw new Error(`File exists but does not export "executor"`);
        }

        return mod.executor as ExecutorMap;
    }
    catch (error) {
        throw new Error(
            `Cannot resolve executor at modules/${module}/${submodule}/${page}: ${String(error)}`
        );
    }

}
```

No manual registration files. Creating the folder + executor file IS the registration. This is what keeps 250 menus maintainable.

- `runner.ts` — shared execution helpers used by `run.spec.ts` (timing, screenshots naming, etc.).

## Entrypoint (`tests/run.spec.ts`)

The only spec file. It:

- Reads run parameters via `cli.ts`
- Loads `TestCase[]` via `loader.ts`
- Generates **one `test()` per row**, titled `TC_ID: Expected`, tagged with `@<Mode>`
- Resolves the executor via `registry.ts` and calls the workflow matching `Function`

```ts
// tests/run.spec.ts
import { test } from "@playwright/test";
import { getRunParams } from "../src/engine/cli";
import { loadTestCases } from "../src/engine/loader";
import { resolveExecutor } from "../src/engine/registry";
import { BaseAction } from "../src/action/baseaction";

const params = getRunParams();
const cases = await loadTestCases(params);

for (const tc of cases) {

    test(
        `${tc.tcId}: ${tc.expected}`,
        { tag: `@${tc.mode}` },
        async ({ page }) => {

            test.skip(!tc.enable, "Disabled in sheet");

            const executor = await resolveExecutor(
                params.module,
                tc.subModule,
                params.page
            );

            const workflow = executor[tc.function];

            if (!workflow) {
                throw new Error(
                    `Unknown Function "${tc.function}" in ${tc.tcId}`
                );
            }

            await workflow(
                { page, action: new BaseAction(page) },
                tc
            );

        }
    );

}
```

## Executors (`modules/**/<page>.executor.ts`)

An executor exports a typed map of workflows, keyed by the `Function` column. Executors contain ALL test logic and assertions.

Responsibilities:

- Orchestrate the workflow using the page object in the same folder
- Perform assertions with `expect()` against `Expected` / `data`
- Throw meaningful errors with `TC_ID` context

Only executors may use: `expect()`, business rules, success/failure decisions.

Must NOT contain: raw locators (belong in the page object), Sheet API calls, hardcoded credentials/URLs.

## Page Objects (`modules/**/<page>.page.ts`)

Represent the menu in the same folder.

Responsibilities:

- Define locators
- Navigate
- Perform UI interactions (through BaseAction whenever possible)
- Return UI values/state when the executor needs them

NOT ALLOWED: `expect()` / assertions, test branching, business rules, success/failure decisions, Sheet/data access.

## BaseAction (`action/baseaction.ts`)

The central, shared action layer — the ONE place for cross-cutting interaction logic, expected to grow over time.

Responsibilities:

- Reusable wrappers: `click()`, `fill()`, `check()`, `select()`, `upload()`, `waitFor()`
- Retry logic beyond Playwright's built-in auto-wait (when genuinely needed)
- Framework-level interaction logging
- Application-specific widgets shared across menus (custom dropdowns, date pickers, confirm dialogs, toasts, file dialogs)

Rules to keep BaseAction healthy:

- **No assertions, no `expect()`, no business logic — ever.**
- Add a method only when the behavior is (a) shared by 2+ pages, or (b) adds real value on top of Playwright (retry, logging, widget handling). Do not wrap a Playwright call that adds nothing.
- Methods stay generic — accept `Locator`/values, never know about specific pages or test data.
- New shared interactions (e.g. `selectFromCustomDropdown()`, `handleConfirmDialog()`, `uploadAndWait()`) go here, not into individual page objects.
- If a group of methods grows large (e.g. grid/table handling), split it into a focused helper in `action/` (e.g. `grid.action.ts`) and compose it into BaseAction.

## Core (`core/`)

Types, constants, shared contracts only. No logic, no Playwright code.

## Config (`config/`)

Environment configuration, base URLs, env selection. Credentials come from `.env` / CI secrets — never in code.

## Utils (`utils/`)

Small pure helpers (date formatting, string utils). No Playwright, no business logic, no Sheet access.

## Connectors (`connectors/`)

External service access only — the Google Sheets client used by the sync script. No business rules, no assertions. Never imported by `engine/loader.ts`, executors, or page objects; only `scripts/sync-sheets.ts` uses it.

## Sync Script (`scripts/sync-sheets.ts`)

The only code in the whole project allowed to call the Google Sheets API.

- Reads all 8 sheet files via `connectors/google-sheet.client.ts`
- Validates every row (required columns present, `Mode` is a valid `RunMode`, `TC_ID` unique per tab)
- Resolves `Data_ID` → `data`
- Writes one JSON file per tab to `src/data/<module>/<submodule>/<page>.json`
- Fails loudly on invalid rows — never writes partial/silent output
- Stays generic: driven by the sheet list in `core/constants.ts`, never `syncAcademic()` / `syncPersonalInfo()` per-module functions

Run it before testing, and whenever the sheet changes: `npm run sync-sheets`.

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

Forbidden:

- Page → Executor
- Page → Sheet / Loader / data
- Executor → Loader or Sheet API (executors receive `TestCase`, they never fetch)
- Executor → runner/engine internals
- BaseAction → Executor or Page Object
- BaseAction → expect()
- utils → anything above it
- Loader → connectors/ or the Sheets API (Loader reads only local `src/data/*.json`)
- Anything except `scripts/sync-sheets.ts` → `connectors/`

---

# 7. Executor Pattern

Standard shape of every executor. Follow it exactly.

```ts
// modules/personal-info/studentInfo/studentlist/studentlist.executor.ts

import { expect } from "@playwright/test";
import type { ExecutorMap } from "../../../../core/types";
import { StudentListPage } from "./studentlist.page";

export const executor: ExecutorMap = {

    async search(ctx, tc) {

        const studentList = new StudentListPage(ctx.page, ctx.action);

        await studentList.goto();

        await studentList.searchStudent(
            String(tc.data.studentId)
        );

        await expect(
            ctx.page.getByRole("row")
        ).toHaveCount(Number(tc.data.expectedCount));

    },

    async create(ctx, tc) {

        const studentList = new StudentListPage(ctx.page, ctx.action);

        await studentList.goto();
        await studentList.createStudent(tc.data);

        await expect(
            ctx.page.getByRole("alert")
        ).toHaveText(/Success/);

    },

};
```

Key points:

- Export name is always `executor`, typed as `ExecutorMap`.
- Each key = one value of the `Function` column. Unknown values fail loudly in `run.spec.ts`.
- One workflow = one focused function. Shared steps inside a menu become private helpers in the same file.

---

# 8. Page Object Pattern

```ts
// modules/personal-info/studentInfo/studentlist/studentlist.page.ts

import type { Page } from "@playwright/test";
import type { BaseAction } from "../../../../action/baseaction";

export class StudentListPage {

    constructor(

        private readonly page: Page,
        private readonly action: BaseAction

    ) {}

    async goto() {

        await this.page.goto("/personal-info/student-list");

    }

    async searchStudent(studentId: string) {

        const searchInput =
            this.page.getByRole("textbox", { name: "Student ID" });

        const searchButton =
            this.page.getByRole("button", { name: "Search" });

        await this.action.fill(searchInput, studentId);
        await this.action.click(searchButton);

    }

    async createStudent(data: Record<string, unknown>) {

        // interactions only — no assertions

    }

}
```

Page objects stay small: locators + interactions + simple readers. Anything shared across pages moves down into BaseAction.

---

# 9. Locator Priority

Always prefer user-facing locators.

1. getByRole()
2. getByLabel()
3. getByPlaceholder()
4. getByText()
5. getByTestId()
6. locator()
7. CSS Selector
8. XPath (last resort)

Avoid CSS or XPath when a semantic Playwright locator is available.

---

# 10. Test Data Model

```ts
// core/types.ts

import type { Page } from "@playwright/test";
import type { BaseAction } from "../action/baseaction";

export type RunMode = "normal" | "smoke" | "regression" | "full";

export interface TestCase {

    tcId: string;                       // TC_ID

    expected: string;                   // Expected

    function: string;                   // Function (key in ExecutorMap)

    mode: RunMode;                      // Mode

    dataId: string;                     // Data_ID

    enable: boolean;                    // Enable

    subModule: string;                  // SubModule

    data: Record<string, unknown>;      // Resolved from Data_ID by the Loader

}

export interface ExecutionContext {

    page: Page;

    action: BaseAction;

}

export type Workflow = (

    ctx: ExecutionContext,
    tc: TestCase

) => Promise<void>;

export type ExecutorMap = Record<string, Workflow>;
```

Workflows return `void` — success/failure is determined by whether `expect()` throws, exactly like a normal Playwright test. No custom `ExecutionResult`.

---

# 11. Running Tests

```bash
# One page
MODULE=personal-info SUBMODULE=studentInfo PAGE=studentlist npx playwright test

# Smoke only, UAT environment
MODULE=personal-info SUBMODULE=studentInfo PAGE=studentlist \
RUNMODE=smoke ENV=uat npx playwright test

# Headed
MODULE=personal-info SUBMODULE=studentInfo PAGE=studentlist npx playwright test --headed
```

Recommended npm scripts in `package.json`:

```json
{
  "scripts": {
    "sync-sheets": "tsx scripts/sync-sheets.ts",
    "test": "playwright test",
    "test:smoke": "cross-env RUNMODE=smoke playwright test",
    "report": "playwright show-report"
  }
}
```

Always run `npm run sync-sheets` first (or as a CI step) before `npm test` — `run.spec.ts` reads only local `src/data/*.json`.

Parameters:

| Parameter | Values | Maps to |
|-----------|--------|---------|
| `MODULE` | one of the 8 module names | Sheet file + `modules/<module>/` |
| `SUBMODULE` | e.g. `studentInfo` | `SubModule` column + folder |
| `PAGE` | e.g. `studentlist` | Sheet tab + folder |
| `RUNMODE` | normal / smoke / regression / full | `Mode` column filter |
| `ENV` | dev / uat / prod | `config/environment.ts` |

---

# 12. Coding Standards

## TypeScript

Strict typing always. Prefer `interface`, `type`, `Record`, generics, `unknown`, `Readonly`. Avoid `any` unless absolutely necessary.

## Async

Always await asynchronous operations.

```ts
// Correct
await action.fill(locator, value);

// Incorrect
action.fill(locator, value);
```

## Error Handling

Never swallow exceptions. Always add context:

```ts
try {
    await studentList.createStudent(tc.data);
}
catch (error) {
    throw new Error(
        `${tc.tcId} create student failed: ${String(error)}`
    );
}
```

In most cases, let Playwright errors propagate naturally — they already include locator context and trigger screenshots/traces.

## Naming

```text
studentlist/                     # page folder — lowercase, matches sheet tab exactly
studentlist.executor.ts          # workflows + assertions
studentlist.page.ts              # page object
studentlist.locators.ts          # optional, only if the page is large
_shared/                         # optional shared fragments within a submodule
baseaction.ts                    # action layer
grid.action.ts                   # focused helper composed into BaseAction
```

- Module folders: kebab-case, exactly matching sheet file names (`personal-info`).
- SubModule folders: camelCase, exactly matching the `SubModule` column (`studentInfo`).
- Page folders/files: lowercase, exactly matching the sheet tab (`studentlist`).
- Spelling is always `executor`.

## Constants

Never hardcode URLs, credentials, sheet IDs/tab/column names, timeouts, or environment names. They live in `config/` and `core/constants.ts`.

---

# 13. Reporting & Logging

Use Playwright's built-ins — do not build custom logging/reporting infrastructure:

- HTML reporter + `trace: "on-first-retry"` + `screenshot: "only-on-failure"` in `playwright.config.ts`
- `test.step()` inside executors to structure long workflows in the report
- BaseAction may emit framework-level interaction logs (one line per action) — nothing else logs

---

# 14. DOs

- Keep everything for a menu inside its one folder: `modules/<module>/<submodule>/<page>/`.
- Keep folder names byte-for-byte identical to the sheet (file / SubModule / tab) — the registry depends on it.
- Keep `login` as the single file `modules/login/login.ts` — infrastructure, not a menu.
- Sync sheets to local JSON (`npm run sync-sheets`) and commit the result before running or opening a PR.
- Review `git diff src/data` as part of code review — that diff IS the test-data change log.
- One `test()` per sheet row, titled with `TC_ID`.
- Put assertions in executors, locators in page objects, shared interactions in BaseAction.
- Grow BaseAction deliberately: shared, generic, assertion-free.
- Keep the engine 100% generic.
- Fail loudly on unknown `Function` values, unresolvable paths, or invalid rows during sync.
- Use strict TypeScript and meaningful error messages.

# 15. DON'Ts

Do NOT:

- Create a separate `pages/` tree — the page object lives next to its executor.
- Turn `login` into a `modules/login/login/login.executor.ts` + `login.page.ts` folder pair — it stays one file.
- Add manual registration files — resolution is by folder convention.
- Add ordering prefixes or decorations to module folder names (`[8]initial-setup` breaks resolution — use `initial-setup`).
- Call the Google Sheets API at test run time, or from executors, page objects, or `engine/loader.ts`.
- Hand-edit files under `src/data/` — fix the sheet, then re-sync.
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
- Treat `login` as the exception: a single `modules/login/login.ts` file, never split into a folder.
- Name the folder and files exactly after the sheet tab (lowercase) and the `SubModule` column (camelCase).
- Follow the Executor Pattern (Section 7): export `executor: ExecutorMap` with one key per `Function` value in the sheet.
- Follow the Page Object Pattern (Section 8).
- Assume test data comes from `src/data/*.json` (already synced) — never write code that calls the Sheets API outside `scripts/sync-sheets.ts`.
- Reuse existing BaseAction methods; propose new BaseAction methods only for genuinely shared behavior.
- Never duplicate existing logic — check `action/`, `_shared/`, and neighboring pages first.
- Use only the tools in Section 2.
- Follow SOLID, prefer composition over inheritance, keep methods short and single-purpose.
- Produce complete, production-ready code — no placeholders or TODOs unless explicitly requested.
- Maintain strict typing throughout.

---

# 17. Final Principle

When in doubt:

- One menu = one folder = executor + page, side by side. `login` is the one deliberate exception — one file, infrastructure only.
- The folder path is the contract: module = Sheet file, submodule = `SubModule` column, page = Sheet tab.
- Sheets are for editing; `src/data/*.json` is for running — sync between them, never skip the sync, never hand-edit the JSON.
- Keep the engine generic; keep assertions in executors; keep locators in page objects; keep shared interactions in BaseAction.
- Let Playwright Test do the running, retrying, and reporting.
- Prefer convention over registration, and deleting a layer over adding one.
