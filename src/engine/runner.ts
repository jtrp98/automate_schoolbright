import { Page } from "@playwright/test";
import { createRegistry, Registry } from "./registry";
import { BaseAction } from "../action/baseaction";
import { ExecutionContext } from "../core/context";
import { ExecutionResult, TestCase, TestData } from "../core/types";

export class Runner {

    private readonly registry: Registry;

    constructor() {

        this.registry = createRegistry();

    }

    resolveTestData(testCase: TestCase, testData: TestData[]): TestData {

        if (testCase.dataId === "-") {

            return { dataId: "-", values: {} };

        }

        const data = testData.find(item => item.dataId === testCase.dataId);

        if (!data) {

            throw new Error(
                `Test data not found for Data_ID "${testCase.dataId}" (${testCase.tcId})`
            );

        }

        return data;

    }

    async runTestCase(
        page: Page,
        testCase: TestCase,
        data: TestData
    ): Promise<ExecutionResult> {

        const executor = this.registry.resolve(testCase.function);

        const context: ExecutionContext = {
            page,
            action: new BaseAction(page)
        };

        return executor.execute(context, testCase, data);

    }

}
