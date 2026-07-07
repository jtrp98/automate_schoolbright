import { ExecutionContext, } from "./context";

import {
    ExecutionResult,
    TestCase,
    TestData,
} from "./types";

export interface Executor {

    execute(
        context: ExecutionContext,
        testCase: TestCase,
        data: TestData
    ): Promise<ExecutionResult>;

}