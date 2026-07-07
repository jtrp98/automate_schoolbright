import { expect } from "@playwright/test";
import { Executor } from "../../core/interfaces";
import { ExecutionContext } from "../../core/context";
import { TestCase, TestData, ExecutionResult } from "../../core/types";
import { LoginPage } from "../../pages/[0]login/login.page";
import { Urls } from "../../config/urls";

export class LoginExecutor implements Executor {

    async execute(
        context: ExecutionContext,
        testCase: TestCase,
        data: TestData
    ): Promise<ExecutionResult> {

        const loginPage = new LoginPage(context.page, context.action);
        const mode = String(data.values.mode ?? "normal").toUpperCase();

        if (mode === "BYPASS") {

            await loginPage.loginBypass();

        } else {

            await loginPage.goto();

            await loginPage.login(
                String(data.values.school ?? ""),
                String(data.values.username ?? ""),
                String(data.values.password ?? "")
            );

        }

        const loggedIn = context.page.url().includes(Urls.dashboard);
        const modalMessage = loggedIn
            ? null
            : await context.action.getModalMessage();

        expect(
            loggedIn || (modalMessage?.includes(testCase.expected) ?? false),
            `Login result did not match expected outcome "${testCase.expected}"`
        ).toBeTruthy();

        return {
            success: true,
            message: `${testCase.tcId} passed`
        };

    }

}
