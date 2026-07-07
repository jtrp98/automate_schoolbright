import { DefaultRunConfig, EnvironmentMode, RunConfig } from "../config/run.config";
import { RunMode } from "../core/types";

export function parseCliArgs(argv: string[] = process.argv.slice(2)): RunConfig {

    const args = new Map<string, string>();

    for (let i = 0; i < argv.length; i++) {

        const token = argv[i];

        if (!token.startsWith("--")) {

            continue;

        }

        const key = token.slice(2);
        const next = argv[i + 1];
        const hasValue = next !== undefined && !next.startsWith("--");

        args.set(key, hasValue ? next : "true");

        if (hasValue) {

            i++;

        }

    }

    const module = args.get("module");
    const page = args.get("page");

    if (!module) {

        throw new Error("Missing required CLI argument: --module");

    }

    if (!page) {

        throw new Error("Missing required CLI argument: --page");

    }

    return {
        ...DefaultRunConfig,
        runmode: (args.get("runmode") as RunMode | undefined) ?? DefaultRunConfig.runmode,
        mode: (args.get("mode") as EnvironmentMode | undefined) ?? DefaultRunConfig.mode,
        module,
        submodule: args.get("submodule"),
        page,
        headed: args.has("headed") ? args.get("headed") !== "false" : DefaultRunConfig.headed
    };

}
