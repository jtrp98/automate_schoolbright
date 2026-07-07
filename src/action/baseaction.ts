import { Page, Locator } from "@playwright/test";
import { Environment } from "../config/environment";
import { TIMEOUTS } from "../core/constants";

export class BaseAction {

    constructor(
        private readonly page: Page
    ) {}

    async gotoSystem(path: string): Promise<void> {
        await this.page.goto(`${Environment.SYSTEM_URL}${path}`);
    }

    async gotoAcademic(path: string): Promise<void> {
        await this.page.goto(`${Environment.ACADEMIC_URL}${path}`);
    }

    async click(locator: Locator): Promise<void> {
        await locator.click();
    }

    async clickByText(text: string): Promise<void> {
        await this.page.getByRole("button", { name: text }).click();
    }

    async fill(locator: Locator, value: string): Promise<void> {
        await locator.fill(value);
    }

    async fillByText(text: string, value: string): Promise<void> {
        await this.page.getByRole("textbox", { name: text }).fill(value);
    }

    async check(locator: Locator, checked = true): Promise<void> {
        await locator.setChecked(checked);
    }

    async select(
        locator: Locator,
        option: string | { value?: string; label?: string; index?: number }
    ): Promise<void> {
        await locator.selectOption(option);
    }

    async upload(locator: Locator, files: string | string[]): Promise<void> {
        await locator.setInputFiles(files);
    }

    async clear(locator: Locator): Promise<void> {
        await locator.clear();
    }

    async press(locator: Locator, key: string): Promise<void> {
        await locator.press(key);
    }

    async waitFor(locator: Locator, options?: Parameters<Locator["waitFor"]>[0]): Promise<void> {
        await locator.waitFor(options);
    }

    async waitForLoadState(): Promise<void> {
        await this.page.waitForLoadState("networkidle");
    }

    async getText(locator: Locator): Promise<string> {
        return locator.innerText();
    }

    async isVisible(locator: Locator): Promise<boolean> {
        return locator.isVisible();
    }

    async getModalMessage(
        selector = "#modal-content",
        timeout: number = TIMEOUTS.MODAL
    ): Promise<string | null> {

        const modal = this.page.locator(selector);

        try {

            await modal.waitFor({ state: "visible", timeout });

            return (await modal.textContent())?.trim() ?? null;

        } catch {

            return null;

        }

    }

    async hasModalMessage(text: string, selector = "#modal-content"): Promise<boolean> {

        const message = await this.getModalMessage(selector);

        return message?.includes(text) ?? false;

    }

}
