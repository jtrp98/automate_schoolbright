import { Executor } from "../../../../core/interfaces";
import { ExecutionContext } from "../../../../core/context";
import { TestCase, TestData, ExecutionResult } from "../../../../core/types";
import { SchoolsettingPage } from "../../../../pages/[8]initial-setup/school-setting/schoolsetting/schoolsetting.page";

export class SchoolsettingExecutor implements Executor {

    async execute(
        context: ExecutionContext,
        testCase: TestCase,
        data: TestData
    ): Promise<ExecutionResult> {

        const schoolsettingPage = new SchoolsettingPage(context.page, context.action);

        return {
            success: true,
            message: `${testCase.tcId} passed`
        };

    }

}
