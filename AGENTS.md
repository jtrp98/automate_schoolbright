# Automation Testing Framework - AI Agent Guide

This document defines the architecture, coding standards, development workflow, and AI generation rules for the Playwright + TypeScript automation testing framework.

The primary objective is to ensure that all AI-generated code consistently follows the project's architecture, naming conventions, design principles, and best practices to support a large-scale system consisting of 9 core modules and over 250 application menus.

---

# 1. Architecture Overview

This framework follows these core design principles:

- **Data-Driven Testing** — Test cases and test data are managed externally using Google Sheets.
- **Page Object Model (POM)** — UI interactions are isolated from business logic.
- **Separation of Concerns** — Every layer has a single responsibility.
- **Dependency Injection** — Dependencies are injected instead of instantiated arbitrarily.
- **Registry Pattern** — Executors are resolved through a centralized registry.
- **TypeScript Strict Mode** — Strong typing throughout the project.
- **Scalable Modular Design** — Supports hundreds of menus without creating bottlenecks.

---

## Overall Execution Flow

```text
Google Sheets (Test Data)
        │
        ▼
Loader (CLI Driven)
        │
        ▼
TestCase + TestData
        │
        ▼
Runner
        │
        ▼
Executor Registry
        │
        ▼
Executor
        │
        ▼
Page Object
        │
        ▼
BaseAction
        │
        ▼
Playwright
```

---

# 2. Technology Stack & Tools

All generated code must target this exact toolchain. Never introduce a new library without explicit approval.

| Tool | Purpose | Notes |
|------|---------|-------|
| **Node.js (LTS)** | Runtime | Use LTS features only |
| **TypeScript (strict mode)** | Language | `"strict": true` in `tsconfig.json` |
| **Playwright Test (`@playwright/test`)** | Test runner + browser automation | Use `expect` from `@playwright/test` only |
| **googleapis (`googleapis`)** | Google Sheets API client | Used only inside `connectors/` |
| **dotenv** | Environment variables | Loaded only in `config/environment.ts` |
| **ESLint + Prettier** | Lint & format | Code must pass lint before commit |
| **ts-node / tsx** | Run TypeScript CLI scripts | Used by `engine/cli.ts` |
| **Playwright HTML Reporter** | Reporting | Screenshots on failure |

Rules:

- Import `expect` only inside Executors.
- `googleapis` may be imported only inside `connectors/google-sheet.client.ts`.
- Never call `process.env` outside `config/`.
- Never install or import Selenium, Puppeteer, Cypress, axios (use Playwright `request`), or lodash.

---

# 3. Project Structure

The framework is organized by business domain, then by **SubModule**, then by **Menu (Page)**.

Never create files directly under `pages/` or `modules/`. Every executor and page object must live inside its own menu folder.

```text
src/

├── action/
│     baseaction.ts
│
├── config/
│     environment.ts
│
├── connectors/
│     google-sheet.client.ts
│
├── core/
│     context.ts
│     interfaces.ts
│     types.ts
│     constants.ts
│
├── engine/
│     cli.ts
│     loader.ts
│     registry.ts
│     runner.ts
│     filter.ts
│
├── modules/
│     login/
│     personal-info/
│     │     personal-info.registry.ts
│     │     studentInfo/
│     │     │     studentlist/
│     │     │     │     studentlist.executor.ts
│     │     │     studentprofile/
│     │     │           studentprofile.executor.ts
│     │     staffInfo/
│     │           stafflist/
│     │                 stafflist.executor.ts
│     academic/
│     student-affairs/
│     general-admin/
│     accounting/
│     store/
│     report/
│     initial-setup/
│
└── pages/
      login/
      personal-info/
      │     studentInfo/
      │     │     studentlist/
      │     │     │     studentlist.page.ts
      │     │     studentprofile/
      │     │           studentprofile.page.ts
      │     staffInfo/
      │           stafflist/
      │                 stafflist.page.ts
      academic/
      student-affairs/
      general-admin/
      accounting/
      store/
      report/
      initial-setup/
```

## Folder Hierarchy Rule

```text
modules/<module>/<submodule>/<menu>/<menu>.executor.ts
pages/<module>/<submodule>/<menu>/<menu>.page.ts
```

Example (full path):

```text
src/modules/personal-info/studentInfo/studentlist/studentlist.executor.ts
src/pages/personal-info/studentInfo/studentlist/studentlist.page.ts
```

- `<module>` — business domain (matches one Google Sheet file)
- `<submodule>` — feature group inside the module (matches the `SubModule` column)
- `<menu>` — one application menu / page (matches one Sheet tab)

The `modules/`, `pages/`, and Google Sheet structure must always stay in sync:

| Level | Folder | Google Sheet | CLI Argument |
|-------|--------|--------------|--------------|
| Module | `modules/personal-info/` | Sheet **file** `personal-info` | `--module personal-info` |
| SubModule | `studentInfo/` | Column `SubModule` | `--submodule studentInfo` |
| Menu / Page | `studentlist/` | Sheet **tab** `studentlist` | `--page studentlist` |

Each module has exactly one `<module>.registry.ts` at the module root that registers every executor inside that module.

---

# 4. Google Sheet Structure

There are **8 Google Sheet files**, one per business module (login is handled internally and has no sheet):

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

- Each **tab** = one menu / page (e.g. tab `studentlist`).
- Each **row** = one test case.

## Required Columns (every tab)

| Column | Type | Description |
|--------|------|-------------|
| `TC_ID` | string | Unique test case ID (e.g. `PI-STU-001`) |
| `Expected` | string | Expected result / assertion description |
| `Function` | string | Executor key registered in the module registry (e.g. `studentlist.search`) |
| `Mode` | string | Run mode this case belongs to: `normal` / `smoke` / `regression` / `full` |
| `Data_ID` | string | Reference key to the test data row/set used by this case |
| `Enable` | boolean | `TRUE` = run, `FALSE` = skip |
| `SubModule` | string | SubModule name (must match the folder, e.g. `studentInfo`) |

## Sheet Rules

- The Loader must map these columns into a strongly typed `TestCase`.
- Rows with `Enable = FALSE` are filtered out by `engine/filter.ts`, never inside Executors.
- `Function` is the **registry key**. The Runner resolves the executor via `registry.resolve(testCase.function)`.
- `Data_ID` links a test case to its data set. Executors read the resolved data through `TestData`, never through the Sheet client directly.
- Never hardcode sheet names, tab names, or column names inside Executors or Page Objects — they belong in `core/constants.ts`.

---

# 5. Layer Responsibilities

## Core

Contains only:

- Interfaces
- Types
- Constants
- Models
- Shared Contracts
- Execution Context

Must NOT contain:

- Business Logic
- UI Logic
- Playwright Code

---

## Config

Contains:

- Environment configuration
- Base URLs
- Runtime configuration
- Feature flags

Must NOT contain:

- Credentials
- Business Logic

---

## Engine

Responsible for:

- CLI Parsing
- Loading Test Data
- Filtering Test Cases (`Enable`, `Mode`, `SubModule`)
- Resolving Executors
- Running Tests
- Reporting

Must remain completely generic.

Never add module-specific logic.

---

## Connectors

Responsible only for external services.

Examples:

- Google Sheets
- REST API
- Database
- Storage

Must NOT contain:

- Business Rules
- Assertions

---

## BaseAction

Contains reusable Playwright wrappers.

Examples:

- click()
- fill()
- check()
- select()
- upload()
- waitFor()

Responsibilities:

- Retry logic
- Logging
- Common interaction handling

Must NOT contain:

- Assertions
- Business Logic

Whenever possible, Page Objects should interact through BaseAction instead of calling Playwright methods directly.

---

## Page Objects

Represent one application page or menu. One page object per menu folder.

Responsibilities:

- Define locators
- Navigate pages
- UI interactions
- Return UI values when needed

Allowed:

- getByRole()
- getByLabel()
- getByText()
- BaseAction

NOT ALLOWED:

- expect()
- Assertions
- Test branching
- Business rules
- Success/failure decisions
- Google Sheet access

---

## Executors

Executors contain all business logic. One executor file per menu folder; one executor file may register multiple `Function` keys for that menu.

Responsibilities:

- Read TestData
- Read TestCase
- Execute workflows
- Perform assertions (validate against `Expected`)
- Return ExecutionResult

Only Executors may use:

- expect()
- Business rules
- Validation logic

---

# 6. Dependency Rules

Dependencies must always flow downward.

```text
Engine
    ↓
Executor
    ↓
Page Object
    ↓
BaseAction
    ↓
Playwright
```

Never reverse dependencies.

Forbidden:

- Page → Executor
- Executor → Runner
- BaseAction → Executor
- BaseAction → expect()
- Page → Google Sheets
- Page → Business Logic
- Executor → googleapis (must go through Loader/TestData)

---

# 7. Coding Standards

## TypeScript

Always use strict typing.

Prefer:

- interface
- type
- Record
- Generic<T>
- unknown
- Readonly

Avoid:

- any

unless absolutely necessary.

---

## Async

Always await asynchronous operations.

Correct

```ts
await page.click();
await action.fill(locator, value);
```

Incorrect

```ts
page.click();
action.fill(locator, value);
```

---

## Error Handling

Never swallow exceptions.

Incorrect

```ts
try {

}
catch {

}
```

Correct

```ts
try {

}
catch (error) {

    throw new Error(
        `Login failed: ${String(error)}`
    );

}
```

Always provide meaningful error messages.

---

# 8. Naming Conventions

All folder and file names for menus use lowercase; submodule folders use camelCase exactly as they appear in the `SubModule` column.

Pages

```
studentlist.page.ts

grade-entry.page.ts

student-profile.page.ts
```

Executors (note: spelling is always `executor`, never `excecutor`)

```
studentlist.executor.ts

grade-entry.executor.ts
```

Registry (one per module, at module root)

```
personal-info.registry.ts

academic.registry.ts

report.registry.ts
```

Registry Keys (`Function` column)

```
<menu>.<action>

studentlist.search
studentlist.create
studentlist.delete
```

Interfaces

```
executor.interface.ts
```

Types

```
execution-result.ts
```

---

# 9. Page Object Rules

Page Objects should remain small and reusable.

Example — `src/pages/personal-info/studentInfo/studentlist/studentlist.page.ts`

```ts
export class StudentListPage {

    constructor(

        private readonly page: Page,
        private readonly action: BaseAction

    ) {}

    async searchStudent(studentId: string) {

        const searchInput =
            this.page.getByRole("textbox", {
                name: "Student ID"
            });

        const searchButton =
            this.page.getByRole("button", {
                name: "Search"
            });

        await this.action.fill(searchInput, studentId);
        await this.action.click(searchButton);

    }

    async getResultCount(): Promise<number> {

        return this.page
            .getByRole("row")
            .count();

    }

}
```

---

# 10. Executor Rules

Executors contain the workflow and assertions.

Example — `src/modules/personal-info/studentInfo/studentlist/studentlist.executor.ts`

```ts
export class StudentListExecutor implements Executor {

    async execute(

        context: ExecutionContext,
        testCase: TestCase,
        data: TestData

    ): Promise<ExecutionResult> {

        const page =
            new StudentListPage(
                context.page,
                context.action
            );

        await page.searchStudent(
            String(data.values.studentId)
        );

        await expect(
            context.page.getByRole("alert")
        ).toHaveText(new RegExp(testCase.expected));

        return {

            success: true,
            message: `${testCase.tcId} passed`

        };

    }

}
```

Executors are the only layer allowed to use:

- expect()
- Business validation
- Success/failure determination

---

# 11. Locator Priority

Always prefer user-facing locators.

Priority order:

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

# 12. CLI Driven Execution

Example

```bash
npx playwright test \
--headed \
--runmode normal \
--mode dev \
--module personal-info \
--submodule studentInfo \
--page studentlist
```

Arguments

| Argument | Description | Maps To |
|-----------|-------------|---------|
| runmode | normal / smoke / regression / full | `Mode` column filter |
| mode | dev / uat / prod | Environment in `config/` |
| module | Business module | Google Sheet **file** + `modules/<module>/` |
| submodule | Feature group | `SubModule` column + `<submodule>/` folder |
| page | Menu | Sheet **tab** + `<menu>/` folder |

---

# 13. Loader Rules

The Loader must remain completely generic.

The Loader understands only:

- module → which of the 8 Sheet files to open
- submodule → filter rows by `SubModule` column
- page → which tab to read

Never create:

```ts
loadAcademic()

loadAccounting()

loadReport()

loadLogin()
```

Instead, dynamically resolve data using CLI parameters.

The Loader maps each row to a typed `TestCase`:

```ts
interface TestCase {

    tcId: string;        // TC_ID

    expected: string;    // Expected

    function: string;    // Function (registry key)

    mode: RunMode;       // Mode

    dataId: string;      // Data_ID

    enable: boolean;     // Enable

    subModule: string;   // SubModule

}
```

---

# 14. Registry Rules

Every business module owns its own registry at the module root.

Example

```
personal-info.registry.ts

academic.registry.ts

report.registry.ts
```

Each module registry registers all executors of every menu inside the module, keyed by the `Function` value:

```ts
registry.register("studentlist.search", StudentListExecutor);
registry.register("studentlist.create", StudentListExecutor);
```

The main registry (`engine/registry.ts`) imports all module registries.

Runner must never instantiate Executors directly.

Incorrect

```ts
new StudentListExecutor();
```

Correct

```ts
registry.resolve(testCase.function);
```

---

# 15. Dependency Injection Rules

Dependencies should always be injected.

Correct

```ts
constructor(

    private readonly page: Page,
    private readonly action: BaseAction

) {}
```

Incorrect

```ts
constructor(){

    this.action =
        new BaseAction(page);

}
```

---

# 16. Test Data Model

Use strongly typed models.

Example

```ts
type RunMode = "normal" | "smoke" | "regression" | "full";

interface TestCase {

    tcId: string;

    expected: string;

    function: string;

    mode: RunMode;

    dataId: string;

    enable: boolean;

    subModule: string;

}

interface TestData {

    dataId: string;

    values: Record<string, unknown>;

}

interface ExecutionContext {

    page: Page;

    action: BaseAction;

}

interface ExecutionResult {

    success: boolean;

    message: string;

}
```

---

# 17. Logging Rules

Logging should occur only in Executors.

Log:

- Test Start (include `TC_ID`)
- Test End
- Failure
- Screenshot Path
- Execution Time

Do not log inside:

- Page Objects
- BaseAction
- Connectors

unless it is framework-level logging.

---

# 18. Constants

Never hardcode:

- URLs
- Credentials
- Sheet file names / tab names / column names
- Timeout Values
- Environment Names

Store them in:

- config/
- constants.ts

---

# 19. DOs

- Follow the defined architecture.
- Keep `modules/`, `pages/`, and Sheet structure in sync (module → submodule → menu).
- Keep layers independent.
- Use strict TypeScript.
- Return ExecutionResult.
- Write reusable methods.
- Prefer Playwright locators.
- Inject dependencies.
- Resolve Executors through Registry using the `Function` key.
- Keep Engine generic.
- Write meaningful errors.

---

# 20. DON'Ts

Do NOT:

- Use any unnecessarily.
- Create executor or page files outside their `<module>/<submodule>/<menu>/` folder.
- Put assertions inside Page Objects.
- Put business logic inside Connectors.
- Hardcode URLs.
- Hardcode credentials.
- Hardcode test data, sheet names, tab names, or column names.
- Instantiate Executors in Runner.
- Access Google Sheets from Page Objects or Executors.
- Use XPath unless absolutely necessary.
- Ignore TypeScript errors.
- Swallow exceptions.
- Introduce new dependencies outside the approved Technology Stack (Section 2).

---

# 21. AI Code Generation Rules

When generating code, AI must:

- Preserve the project architecture.
- Place every new executor at `modules/<module>/<submodule>/<menu>/<menu>.executor.ts`.
- Place every new page object at `pages/<module>/<submodule>/<menu>/<menu>.page.ts`.
- Register every new executor in the module registry with a `Function` key matching the Sheet.
- Never move business logic into Page Objects.
- Never place UI logic inside Executors beyond orchestration.
- Never duplicate existing logic.
- Reuse existing components whenever possible.
- Use only the tools listed in the Technology Stack (Section 2).
- Follow SOLID principles.
- Prefer composition over inheritance.
- Keep methods focused on a single responsibility.
- Keep methods reasonably short and readable.
- Produce production-ready code.
- Generate complete implementations.
- Avoid placeholder code or TODO comments unless explicitly requested.
- Maintain strict typing.
- Preserve modular architecture.
- Generate scalable code suitable for hundreds of menus.

---

# 22. Final Principle

When in doubt:

- Keep the Engine generic.
- Keep business logic inside Executors.
- Keep UI logic inside Page Objects.
- Keep Playwright wrappers inside BaseAction.
- Keep shared contracts inside Core.
- Keep configuration inside Config.
- Resolve Executors only through the Registry.
- Keep folder structure aligned with the Google Sheet structure: module = Sheet file, submodule = `SubModule` column, page = Sheet tab.
- Make every implementation reusable, maintainable, and scalable.
