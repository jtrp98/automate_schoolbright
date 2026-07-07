import type { RunMode } from "../core/types";
import type { AppEnv } from "../config/environment";

export interface RunParams {

    module: string;

    subModule?: string;

    page: string;

    runMode: RunMode;

    env: AppEnv;

}

export function getRunParams(): RunParams {

    const module = process.env.MODULE;
    const page = process.env.PAGE;

    if (!module) {

        throw new Error("Missing required environment variable: MODULE");

    }

    if (!page) {

        throw new Error("Missing required environment variable: PAGE");

    }

    return {
        module,
        subModule: process.env.SUBMODULE,
        page,
        runMode: (process.env.RUNMODE as RunMode | undefined) ?? "normal",
        env: (process.env.ENV as AppEnv | undefined) ?? "dev"
    };

}
