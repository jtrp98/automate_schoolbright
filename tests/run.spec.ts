import { test } from "@playwright/test";
import { getRunParams } from "../src/engine/cli";
import { loadTestCases } from "../src/engine/loader";
import { resolveExecutor } from "../src/engine/registry";
import { logStart, logEnd } from "../src/engine/runner";
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

            const startedAt = Date.now();
            logStart(tc);

            await workflow(
                { page, action: new BaseAction(page) },
                tc
            );

            logEnd(tc, Date.now() - startedAt);

        }
    );

}
