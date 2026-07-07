import { Page } from "@playwright/test";
import { BaseAction } from "../../../../action/baseaction";

export class RoomlistPage {

    constructor(
        private readonly page: Page,
        private readonly action: BaseAction
    ) {}

}
