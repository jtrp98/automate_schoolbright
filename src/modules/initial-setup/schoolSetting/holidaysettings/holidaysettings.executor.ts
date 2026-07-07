import type { ExecutorMap } from "../../../../core/types";
import { HolidaysettingsPage } from "./holidaysettings.page";

export const executor: ExecutorMap = {

    async execute(ctx) {

        new HolidaysettingsPage(ctx.page, ctx.action);

    }

};
