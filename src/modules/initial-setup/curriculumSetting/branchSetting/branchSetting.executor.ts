import type { ExecutorMap } from "../../../../core/types";
import { BranchSettingPage } from "./branchSetting.page";

export const executor: ExecutorMap = {

    async execute(ctx) {

        new BranchSettingPage(ctx.page, ctx.action);

    }

};
