import fs from "fs";
import path from "path";
import { DATA_DIR } from "../core/constants";
import type { TestCase } from "../core/types";
import type { RunParams } from "./cli";

function readTestCaseFile(filePath: string): TestCase[] {

    return JSON.parse(fs.readFileSync(filePath, "utf8")) as TestCase[];

}

function readPageFiles(module: string, subModule: string | undefined, page: string): TestCase[] {

    const moduleDir = path.resolve(DATA_DIR, module);

    if (subModule) {

        const filePath = path.join(moduleDir, subModule, `${page}.json`);

        return fs.existsSync(filePath) ? readTestCaseFile(filePath) : [];

    }

    const subModuleDirs = fs.readdirSync(moduleDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

    const filePaths = [
        path.join(moduleDir, `${page}.json`),
        ...subModuleDirs.map(sub => path.join(moduleDir, sub, `${page}.json`))
    ];

    return filePaths
        .filter(filePath => fs.existsSync(filePath))
        .flatMap(readTestCaseFile);

}

export async function loadTestCases(params: RunParams): Promise<TestCase[]> {

    const testCases = readPageFiles(params.module, params.subModule, params.page);

    if (testCases.length === 0) {

        throw new Error(
            `No synced test data found for ${params.module}/${params.subModule ?? "*"}/${params.page}. Run "npm run sync-sheets" first.`
        );

    }

    return testCases
        .filter(tc => !params.subModule || tc.subModule === params.subModule)
        .filter(tc => params.runMode === "full" || tc.mode === params.runMode);

}
