import { Page } from "@playwright/test";
import { BaseAction } from "../../action/baseaction";
import { Urls } from "../../config/urls";

export class LoginPage {

    constructor(
        private readonly page: Page,
        private readonly action: BaseAction
    ) {}

    async goto() {
        await this.action.gotoSystem(Urls.loginBypass ?? "");
    }

    async login(schoolName: string, username: string, password: string) {
        await this.action.waitForLoadState();
        await this.action.selectOption("#sltSchool", { label: schoolName });
        await this.action.fillByText("เข้าสู่ระบบ", username);
        await this.action.fillByText("รหัสผ่าน", password);
        await this.action.clickByText("เข้าสู่ระบบ");
        await this.page.waitForTimeout(5000);
    }

    async loginBypass() {
        await this.goto();
    }

}
