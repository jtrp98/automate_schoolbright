import type { Page } from "@playwright/test";
import type { BaseAction } from "../../../../action/baseaction";

export class RoomlistPage {

    constructor(
        private readonly page: Page,
        private readonly action: BaseAction
    ) {}

}
