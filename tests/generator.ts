import { test } from "@playwright/test";
import { Loader } from "../src/engine/loader";
import { Filter } from "../src/engine/filter";
import { Runner } from "../src/engine/runner";
import { parseCliArgs } from "../src/engine/cli";

export async function generateTests() {

    const config = parseCliArgs();

    const loader = new Loader();
    const filter = new Filter();
    const runner = new Runner();

    const testCases = await loader.loadTestCases(config.module, config.page, config.submodule);
    const testData = await loader.loadTestData(config.module, config.page);
    const filteredTestCases = filter.execute(testCases, config);

    for (const testCase of filteredTestCases) {

        test(`${testCase.tcId} - ${testCase.expected}`, async ({ page }) => {

            const data = runner.resolveTestData(testCase, testData);
            const result = await runner.runTestCase(page, testCase, data);

            if (!result.success) {

                throw new Error(`${testCase.tcId} failed: ${result.message}`);

            }

        });

    }

}
