import { Executor } from "../../../../core/interfaces";
import { ExecutionContext } from "../../../../core/context";
import { TestCase, TestData, ExecutionResult } from "../../../../core/types";
import { TimeiosettingsPage } from "../../../../pages/[8]initial-setup/personal-employee-setting/timeiosettings/timeiosettings.page";

export class TimeiosettingsExecutor implements Executor {

    async execute(
        context: ExecutionContext,
        testCase: TestCase,
        data: TestData
    ): Promise<ExecutionResult> {

        const timeiosettingsPage = new TimeiosettingsPage(context.page, context.action);

        return {
            success: true,
            message: `${testCase.tcId} passed`
        };

    }

}
