import type { ExecutorMap } from "../../../../core/types";
import { TimeiosettingsPage } from "./timeiosettings.page";

export const executor: ExecutorMap = {

    async execute(ctx) {

        new TimeiosettingsPage(ctx.page, ctx.action);

    }

};
