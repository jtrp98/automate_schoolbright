import type { Locator, Page } from "@playwright/test";
import type { BaseAction } from "../../../../action/baseaction";

const SCHOOLSETTING_PATH = "/schoolprofile/schoolsetting.aspx";
const RESULT_MODAL_SELECTOR = ".swal2-popup"; // page uses SweetAlert2, not the app's #modal-content

export class SchoolsettingPage {

    private readonly scanOutInput: Locator;
    private readonly scanOutSwitch: Locator;
    private readonly classNameDisableInput: Locator;
    private readonly classNameDisableSwitch: Locator;
    private readonly submitButton: Locator;

    constructor(
        private readonly page: Page,
        private readonly action: BaseAction
    ) {
        this.scanOutInput = page.locator("#behavior_show_minus_sign");
        this.scanOutSwitch = page.locator("#behavior_show_minus_sign + .el-switch-style");
        this.classNameDisableInput = page.locator("#ClassNameDisable");
        this.classNameDisableSwitch = page.locator("#ClassNameDisable + .el-switch-style");
        this.submitButton = page.locator("#btnSubmit");
    }

    async goto(): Promise<void> {
        await this.action.gotoSystem(SCHOOLSETTING_PATH);
        await this.action.waitForLoadState();
    }

    async isScanOutEnabled(): Promise<boolean> {
        return this.scanOutInput.isChecked();
    }

    async isClassNameDisableEnabled(): Promise<boolean> {
        return this.classNameDisableInput.isChecked();
    }

    async setScanOut(enabled: boolean): Promise<void> {

        if (await this.isScanOutEnabled() !== enabled) {
            await this.action.click(this.scanOutSwitch);
        }

    }

    async setClassNameDisable(enabled: boolean): Promise<void> {

        if (await this.isClassNameDisableEnabled() !== enabled) {
            await this.action.click(this.classNameDisableSwitch);
        }

    }

    async submit(): Promise<void> {
        await this.action.click(this.submitButton);
    }

    async hasResultMessage(text: string): Promise<boolean> {
        return this.action.hasModalMessage(text, RESULT_MODAL_SELECTOR);
    }

}
