import { Page } from "@playwright/test";
import { BaseAction } from "../../../../action/baseaction";
import { Urls } from "../../../../config/urls";

export class SchoolProfilePage {

    constructor(
        private readonly page: Page,
        private readonly action: BaseAction
    ) {}
    
}
