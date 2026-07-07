import type { ExecutorMap } from "../../../../core/types";
import { EmpSignerPage } from "./empSigner.page";

export const executor: ExecutorMap = {

    async execute(ctx) {

        new EmpSignerPage(ctx.page, ctx.action);

    }

};
