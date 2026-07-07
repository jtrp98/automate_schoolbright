import type { ExecutorMap } from "../../../../core/types";
import { ClassSettingPage } from "./classSetting.page";

export const executor: ExecutorMap = {

    async execute(ctx) {

        new ClassSettingPage(ctx.page, ctx.action);

    }

};
