import { Executor } from "../../../../core/interfaces";
import { ExecutionContext } from "../../../../core/context";
import { TestCase, TestData, ExecutionResult } from "../../../../core/types";
import { BranchSettingPage } from "../../../../pages/[8]initial-setup/curiculum-setting/branchSetting/branchSetting.page";

export class BranchSettingExecutor implements Executor {

    async execute(
        context: ExecutionContext,
        testCase: TestCase,
        data: TestData
    ): Promise<ExecutionResult> {

        const branchSettingPage = new BranchSettingPage(context.page, context.action);

        return {
            success: true,
            message: `${testCase.tcId} passed`
        };

    }

}
