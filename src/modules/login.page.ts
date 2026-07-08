import type { Page } from "@playwright/test";
import type { BaseAction } from "../action/baseaction";
import { Urls } from "../config/environment";

export class LoginPage {

    constructor(
        private readonly page: Page,
        private readonly action: BaseAction
    ) {}

    async login(schoolName: string, username: string, password: string): Promise<void> {
        await this.action.gotoSystem(Urls.dashboard);
        await this.action.waitForLoadState();
        await this.action.select(this.page.locator("#sltSchool"), { label: schoolName });
        await this.action.fillByText("เข้าสู่ระบบ", username);
        await this.action.fillByText("รหัสผ่าน", password);
        await this.action.clickByText("เข้าสู่ระบบ");

    }

    async loginBypass(): Promise<void> {
        await this.action.gotoSystem(Urls.loginBypass ?? "");
    }

    async waitForDashboard(): Promise<void> {

        await this.page.waitForURL(new RegExp(Urls.dashboard));

    }

    

    isLoggedIn(): boolean {

        return this.page.url().includes(Urls.dashboard);

    }

}
