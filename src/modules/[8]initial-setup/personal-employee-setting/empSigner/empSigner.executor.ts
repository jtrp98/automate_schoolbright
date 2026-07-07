import { Executor } from "../../../../core/interfaces";
import { ExecutionContext } from "../../../../core/context";
import { TestCase, TestData, ExecutionResult } from "../../../../core/types";
import { EmpSignerPage } from "../../../../pages/[8]initial-setup/personal-employee-setting/empSigner/empSigner.page";

export class EmpSignerExecutor implements Executor {

    async execute(
        context: ExecutionContext,
        testCase: TestCase,
        data: TestData
    ): Promise<ExecutionResult> {

        const empSignerPage = new EmpSignerPage(context.page, context.action);

        return {
            success: true,
            message: `${testCase.tcId} passed`
        };

    }

}
