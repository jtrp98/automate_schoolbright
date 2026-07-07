import type { ExecutorMap } from "../../../../core/types";
import { YearlistPage } from "./yearlist.page";

export const executor: ExecutorMap = {

    async execute(ctx) {

        new YearlistPage(ctx.page, ctx.action);

    }

};
