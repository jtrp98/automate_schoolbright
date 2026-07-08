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

            await workflow(
                { page, action: new BaseAction(page) },
                tc
            );

        }
    );

}
