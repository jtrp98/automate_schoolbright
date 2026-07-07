import type { ExecutorMap } from "../core/types";

export async function resolveExecutor(

    module: string,
    submodule: string,
    page: string

): Promise<ExecutorMap> {

    const path =
        `../modules/${module}/${submodule}/${page}/${page}.executor`;

    try {

        const mod = await import(path);

        if (!mod.executor) {

            throw new Error(`File exists but does not export "executor"`);

        }

        return mod.executor as ExecutorMap;

    }
    catch (error) {

        throw new Error(
            `Cannot resolve executor at modules/${module}/${submodule}/${page}: ${String(error)}`
        );

    }

}
