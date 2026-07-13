import { test } from "@playwright/test";
import { getRunParams } from "../src/engine/cli";
import { loadTestCases } from "../src/engine/loader";
import { resolveExecutor } from "../src/engine/registry";
import { BaseAction } from "../src/action/baseaction";
import { LoginPage } from "../src/modules/login.page";

const params = getRunParams();
const cases = await loadTestCases(params);

function isLoginPage(tc: { module: string; subModule: string; page: string }): boolean {
    return tc.module === "initial-setup" && tc.subModule === "Login" && tc.page === "Login";
}

for (const tc of cases) {

    test(
        `${tc.tcId}: ${tc.expected}`,
        { tag: `@${tc.mode}` },
        async ({ page }) => {

            test.skip(!tc.enable, "Disabled in sheet");

            const executor = await resolveExecutor(
                tc.module,
                tc.subModule,
                tc.page
            );

            const workflow = executor[tc.function];

            if (!workflow) {

                throw new Error(
                    `Unknown Function "${tc.function}" in ${tc.tcId}`
                );

            }

            const action = new BaseAction(page);

            // Every page except Login itself requires an authenticated session first;
            // there is no shared storageState/globalSetup, so each test bypass-logs-in here.
            if (!isLoginPage(tc)) {

                await new LoginPage(page, action).loginBypass();
                await action.waitForLoadState();

            }

            await workflow({ page, action }, tc);

        }
    );

}
