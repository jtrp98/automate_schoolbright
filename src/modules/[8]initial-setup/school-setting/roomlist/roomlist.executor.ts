import { Executor } from "../../../../core/interfaces";
import { ExecutionContext } from "../../../../core/context";
import { TestCase, TestData, ExecutionResult } from "../../../../core/types";
import { RoomlistPage } from "../../../../pages/[8]initial-setup/school-setting/roomlist/roomlist.page";

export class RoomlistExecutor implements Executor {

    async execute(
        context: ExecutionContext,
        testCase: TestCase,
        data: TestData
    ): Promise<ExecutionResult> {

        const roomlistPage = new RoomlistPage(context.page, context.action);

        return {
            success: true,
            message: `${testCase.tcId} passed`
        };

    }

}
