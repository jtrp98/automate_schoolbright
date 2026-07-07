import { TestCase } from "../core/types";
import { RunConfig } from "../config/run.config";

export class Filter {

    execute(
        testCases: TestCase[],
        config: RunConfig
    ): TestCase[] {

        return testCases.filter(x => x.enable);

    }

}