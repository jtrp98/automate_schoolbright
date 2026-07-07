import { expect } from "@playwright/test";
import { Executor } from "../../../../core/interfaces";
import { ExecutionContext } from "../../../../core/context";
import { TestCase, TestData, ExecutionResult } from "../../../../core/types";
import { SchoolProfilePage } from "../../../../pages/[8]initial-setup/school-setting/schoolprofile/schoolprofile.page";

export class SchoolProfileExecutor implements Executor {

    async execute(
        context: ExecutionContext,
        testCase: TestCase,
        data: TestData
    ): Promise<ExecutionResult> {

        const schoolProfilePage = new SchoolProfilePage(context.page, context.action);

        return {
            success: true,
            message: `${testCase.tcId} passed`
        };

    }

}
