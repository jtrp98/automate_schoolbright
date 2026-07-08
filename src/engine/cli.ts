import type { RunMode } from "../core/types";
import type { AppEnv } from "../config/environment";

export interface RunParams {

    module?: string;

    subModule?: string;

    page?: string;

    runMode: RunMode;

    env: AppEnv;

}

export function getRunParams(): RunParams {

    return {
        module: process.env.MODULE,
        subModule: process.env.SUBMODULE,
        page: process.env.PAGE,
        runMode: (process.env.RUNMODE as RunMode | undefined) ?? "normal",
        env: (process.env.ENV as AppEnv | undefined) ?? "dev"
    };

}
