import type { Page } from "@playwright/test";
import type { BaseAction } from "../../action/baseaction";
import { Urls } from "../../config/environment";

export class LoginPage {

    constructor(
        private readonly page: Page,
        private readonly action: BaseAction
    ) {}

    async goto(): Promise<void> {

        await this.action.gotoSystem(Urls.loginBypass ?? "");

    }

    async loginAs(schoolName: string, username: string, password: string): Promise<void> {

        await this.action.waitForLoadState();
        await this.action.select(this.page.locator("#sltSchool"), { label: schoolName });
        await this.action.fillByText("เข้าสู่ระบบ", username);
        await this.action.fillByText("รหัสผ่าน", password);
        await this.action.clickByText("เข้าสู่ระบบ");
        await this.page.waitForURL(new RegExp(Urls.dashboard));

    }

    async loginBypass(): Promise<void> {

        await this.page.goto(Urls.loginBypass ?? "");

    }

    isLoggedIn(): boolean {

        return this.page.url().includes(Urls.dashboard);

    }

}
