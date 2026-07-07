import { Page, Locator } from "@playwright/test";
import { Environment } from "../config/environment";

export class BaseAction {
    constructor(
        private page: Page
    ) { }

    async gotoSystem(path:string){
        await this.page.goto(`${Environment.SYSTEM_URL}${path}`);
    }

    async gotoAcademic(path:string){
        await this.page.goto(`${Environment.ACADEMIC_URL}${path}`);
    }

    async click(locator: Locator) {
        await locator.click();
    }

    async clickByText(text: string) {
        const locator = this.page.getByRole('button', { name: text })
        await locator.click();
    }

    async fill(locator: Locator, value: string) {
        await locator.fill(value);
    }

    async fillByText(text: string, value: string) {
        const locator = this.page.getByRole('textbox', { name: text })
        await locator.fill(value);
    }

    async clear(locator: Locator) {
        await locator.clear();
    }

    async press(locator: Locator, key: string) {
        await locator.press(key);
    }

    async selectOption(selector: string, option: string | { value?: string; label?: string; index?: number }) {
        await this.page.locator(selector).selectOption(option);
    }

    async getText(locator: Locator) {
        return await locator.innerText();
    }

    async isVisible(locator: Locator) {
        return await locator.isVisible();
    }

    async waitForLoadState() {
        await this.page.waitForLoadState("networkidle");
    }

    async screenshot(name: string) {
        await this.page.screenshot({
            path: `reports/${name}.png`
        });
    }

    async getModalMessage(selector: string = "#modal-content",timeout: number = 3000): Promise<string | null> {
        const modal = this.page.locator(selector);

        try {
            await modal.waitFor({
                state: "visible",
                timeout
            });

            return (await modal.textContent())?.trim() ?? null;
        } catch {
            return null;
        }
    }

    async hasModalMessage(text: string,selector: string = "#modal-content"): Promise<boolean> {
        const message = await this.getModalMessage(selector);

        return message?.includes(text) ?? false;
    }

}