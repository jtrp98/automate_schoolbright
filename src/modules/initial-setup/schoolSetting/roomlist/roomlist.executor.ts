import type { ExecutorMap } from "../../../../core/types";
import { RoomlistPage } from "./roomlist.page";

export const executor: ExecutorMap = {

    async execute(ctx) {

        new RoomlistPage(ctx.page, ctx.action);

    }

};
