import { expect } from "@playwright/test";
import type { ExecutorMap } from "../core/types";
import { LoginPage } from "./login.page";

interface LoginData {
    School?: string;
    Username?: string;
    Password?: string;
    Expected?: string;
}

export const executor: ExecutorMap = {

    async Login(ctx, tc) {

        const { School, Username, Password, Expected } = tc.data as LoginData;
        const loginPage = new LoginPage(ctx.page, ctx.action);
        if (Expected == "-") {

            await loginPage.loginBypass();
            await loginPage.waitForDashboard();
            expect(loginPage.isLoggedIn()).toBe(true);
            return;

        }

        await loginPage.login(School ?? "", Username ?? "", Password ?? "");
        if (Expected) {

            expect(await ctx.action.hasModalMessage(Expected)).toBe(true);
            return;

        }

        await loginPage.waitForDashboard();
        expect(loginPage.isLoggedIn()).toBe(true);

    }

};
