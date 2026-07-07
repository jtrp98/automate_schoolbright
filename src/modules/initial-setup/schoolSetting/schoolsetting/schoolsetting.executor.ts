import type { ExecutorMap } from "../../../../core/types";
import { SchoolsettingPage } from "./schoolsetting.page";

export const executor: ExecutorMap = {

    async execute(ctx) {

        new SchoolsettingPage(ctx.page, ctx.action);

    }

};
