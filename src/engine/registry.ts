import type { ExecutorMap } from "../core/types";

async function importExecutor(path: string): Promise<ExecutorMap> {

    const mod = await import(path);

    if (!mod.executor) {

        throw new Error(`File exists but does not export "executor"`);

    }

    return mod.executor as ExecutorMap;

}

export async function resolveExecutor(

    module: string,
    submodule: string,
    page: string

): Promise<ExecutorMap> {

    const nestedPath = `../modules/${module}/${submodule}/${page}/${page}.executor`;

    try {

        return await importExecutor(nestedPath);

    }
    catch (nestedError) {

        const flatPath = `../modules/${page.toLowerCase()}.executor`;

        try {

            return await importExecutor(flatPath);

        }
        catch {

            throw new Error(
                `Cannot resolve executor at modules/${module}/${submodule}/${page} or modules/${page.toLowerCase()}: ${String(nestedError)}`
            );

        }

    }

}
