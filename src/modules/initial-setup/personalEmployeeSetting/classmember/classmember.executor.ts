import type { ExecutorMap } from "../../../../core/types";
import { ClassmemberPage } from "./classmember.page";

export const executor: ExecutorMap = {

    async execute(ctx) {

        new ClassmemberPage(ctx.page, ctx.action);

    }

};
