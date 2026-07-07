import type { ExecutorMap } from "../../../../core/types";
import { SchoolProfilePage } from "./schoolprofile.page";

export const executor: ExecutorMap = {

    async update(ctx) {

        new SchoolProfilePage(ctx.page, ctx.action);

    }

};
