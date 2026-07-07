import { Page } from "@playwright/test";
import { LoginPage } from "../../pages/login/login.page";
import { Urls } from "../../config/urls";
import { BaseAction } from "../../action/baseaction";

export class LoginExecutor {

    async execute(
        page: Page,
        data: any
    ) {

        const action = new BaseAction(page);

        const mode = data.mode ?? "NORMAL";
        const loginPage = new LoginPage(page);

        // bypass login
        if (mode === "BYPASS") {
            await loginPage.loginBypass();
              if (page.url().includes(Urls.dashboard)) {
            return {
                success: true,
                message: data.expected
            };
        }
        }

        await loginPage.goto();
        await loginPage.login(data.school, data.username, data.password);

        if (page.url().includes(Urls.dashboard)) {
            return {
                success: true,
                message: data.expected
            };
        }

        if (await action.hasModalMessage(data.expected)) {
            return {
                success: false,
                code: "INVALID_USERNAME_PASSWORD"
            };
        }

    }

}