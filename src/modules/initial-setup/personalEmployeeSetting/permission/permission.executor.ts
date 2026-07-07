import type { ExecutorMap } from "../../../../core/types";
import { PermissionPage } from "./permission.page";

export const executor: ExecutorMap = {

    async execute(ctx) {

        new PermissionPage(ctx.page, ctx.action);

    }

};
