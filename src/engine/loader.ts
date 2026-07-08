import fs from "fs";
import path from "path";
import { DATA_DIR, SHEET_MODULES } from "../core/constants";
import type { TestCase } from "../core/types";
import type { RunParams } from "./cli";

function readTestCaseFile(filePath: string, module: string, page: string): TestCase[] {

    const testCases = JSON.parse(fs.readFileSync(filePath, "utf8")) as TestCase[];

    return testCases.map(tc => ({ ...tc, module: tc.module ?? module, page: tc.page ?? page }));

}

function listJsonFiles(dir: string): string[] {

    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(entry => entry.isFile() && entry.name.endsWith(".json"))
        .map(entry => path.join(dir, entry.name));

}

function readPageFiles(module: string, subModule: string | undefined, page: string | undefined): TestCase[] {

    const moduleDir = path.resolve(DATA_DIR, module);

    if (!fs.existsSync(moduleDir)) {
        return [];
    }

    const dirs = subModule
        ? [path.join(moduleDir, subModule)]
        : [
            moduleDir,
            ...fs.readdirSync(moduleDir, { withFileTypes: true })
                .filter(entry => entry.isDirectory())
                .map(entry => path.join(moduleDir, entry.name))
        ];

    const filePaths = page
        ? dirs.map(dir => path.join(dir, `${page}.json`)).filter(fs.existsSync)
        : dirs.filter(fs.existsSync).flatMap(listJsonFiles);

    return filePaths.flatMap(filePath => readTestCaseFile(filePath, module, path.basename(filePath, ".json")));

}

export async function loadTestCases(params: RunParams): Promise<TestCase[]> {

    const modules = params.module ? [params.module] : [...SHEET_MODULES];

    const testCases = modules.flatMap(module => readPageFiles(module, params.subModule, params.page));

    if (testCases.length === 0) {

        throw new Error(
            `No synced test data found for ${params.module ?? "*"}/${params.subModule ?? "*"}/${params.page ?? "*"}. Run "npm run sync-sheets" first.`
        );

    }

    return testCases
        .filter(tc => !params.subModule || tc.subModule === params.subModule)
        .filter(tc => params.runMode === "full" || tc.mode === params.runMode);

}
