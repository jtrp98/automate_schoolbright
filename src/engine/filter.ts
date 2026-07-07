import { TestCase } from "../core/types";
import { RunConfig } from "../config/run.config";

export class Filter {

    execute(
        testCases: TestCase[],
        config: RunConfig
    ): TestCase[] {

        return testCases.filter(testCase => {

            if (!testCase.enable) {

                return false;

            }

            if (config.runmode === "full") {

                return true;

            }

            return testCase.mode === config.runmode;

        });

    }

}
