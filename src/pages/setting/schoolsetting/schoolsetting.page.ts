import { Page, Locator } from "@playwright/test";


export class SchoolSettingPage {

    private readonly page: Page;


    // locator
    private readonly schoolNameInput: Locator;
    private readonly saveButton: Locator;


    constructor(page: Page) {

        this.page = page;

        this.schoolNameInput =
            page.locator("#schoolName");

        this.saveButton =
            page.getByRole("button", {
                name: "Save"
            });

    }


    async goto() {

        await this.page.goto(
            "/Setting/SchoolSetting"
        );

    }


    async fillSchoolName(
        name: string
    ) {

        await this.schoolNameInput.fill(name);

    }


    async clickSave() {

        await this.saveButton.click();

    }


    async getSchoolNameValue() {

        return await this.schoolNameInput.inputValue();

    }

}