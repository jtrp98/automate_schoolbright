import fs from "fs";
import path from "path";
import { Environment } from "../src/config/environment";
import { SHEET_COLUMNS, SHEET_MODULES, RUN_MODES, DATA_DIR } from "../src/core/constants";
import { getSheetValues, listSheetTitles } from "../src/connectors/google-sheet.client";
import type { RunMode, TestCase } from "../src/core/types";

function toRecords(rows: string[][]): Record<string, string>[] {

    const headers = rows[0] ?? [];

    return rows.slice(1).map(row => {

        const record: Record<string, string> = {};

        headers.forEach((header, index) => {
            record[header] = row[index] ?? "";
        });

        return record;

    });

}

function toTestData(row: Record<string, string>): Record<string, unknown> {

    const values: Record<string, unknown> = { ...row };

    delete values[SHEET_COLUMNS.DATA_ID];

    return values;

}

function resolveData(
    dataId: string,
    dataById: Map<string, Record<string, unknown>>,
    context: string
): Record<string, unknown> {

    if (dataId === "-") {
        return {};
    }

    const data = dataById.get(dataId);

    if (!data) {
        throw new Error(`${context}: test data not found for Data_ID "${dataId}"`);
    }

    return data;

}

async function loadDataById(
    testDataSheetId: string,
    dataTabTitles: string[],
    context: string
): Promise<Map<string, Record<string, unknown>>> {

    const rowsPerTitle = await Promise.all(
        dataTabTitles.map(title => getSheetValues(testDataSheetId, title))
    );

    const dataById = new Map<string, Record<string, unknown>>();

    dataTabTitles.forEach((title, index) => {

        for (const row of toRecords(rowsPerTitle[index])) {

            const dataId = row[SHEET_COLUMNS.DATA_ID];

            if (dataById.has(dataId)) {
                throw new Error(
                    `${context}: duplicate Data_ID "${dataId}" across data tabs (also found in "${title}")`
                );
            }

            dataById.set(dataId, toTestData(row));

        }

    });

    return dataById;

}

const OPTIONAL_COLUMNS: readonly string[] = [SHEET_COLUMNS.SUB_MODULE];

function assertRequiredColumns(row: Record<string, string>, context: string): void {

    for (const column of Object.values(SHEET_COLUMNS)) {

        if (!row[column] && !OPTIONAL_COLUMNS.includes(column)) {
            throw new Error(`${context}: missing required column "${column}"`);
        }

    }

}

function toTestCase(
    row: Record<string, string>,
    dataById: Map<string, Record<string, unknown>>,
    context: string
): TestCase {

    assertRequiredColumns(row, context);

    const tcId = row[SHEET_COLUMNS.TC_ID];
    const dataId = row[SHEET_COLUMNS.DATA_ID];
    const mode = row[SHEET_COLUMNS.MODE].toLowerCase();

    if (!RUN_MODES.includes(mode as RunMode)) {
        throw new Error(`${context}: invalid Mode "${row[SHEET_COLUMNS.MODE]}" for ${tcId}`);
    }

    return {
        tcId,
        expected: row[SHEET_COLUMNS.EXPECTED],
        function: row[SHEET_COLUMNS.FUNCTION],
        mode: mode as RunMode,
        dataId,
        enable: row[SHEET_COLUMNS.ENABLE].toUpperCase() === "TRUE",
        subModule: row[SHEET_COLUMNS.SUB_MODULE],
        data: resolveData(dataId, dataById, `${context} (${tcId})`)
    };

}

function assertUniqueTcIds(testCases: TestCase[], context: string): void {

    const seen = new Set<string>();

    for (const tc of testCases) {

        if (seen.has(tc.tcId)) {
            throw new Error(`${context}: duplicate TC_ID "${tc.tcId}"`);
        }

        seen.add(tc.tcId);

    }

}

function groupBySubModule(testCases: TestCase[]): Map<string, TestCase[]> {

    const bySubModule = new Map<string, TestCase[]>();

    for (const tc of testCases) {

        const group = bySubModule.get(tc.subModule) ?? [];
        group.push(tc);
        bySubModule.set(tc.subModule, group);

    }

    return bySubModule;

}

function writeTestCases(module: string, subModule: string, page: string, testCases: TestCase[]): void {

    const dir = subModule
        ? path.resolve(DATA_DIR, module, subModule)
        : path.resolve(DATA_DIR, module);

    fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(
        path.join(dir, `${page}.json`),
        `${JSON.stringify(testCases, null, 2)}\n`
    );

}

async function syncTab(
    module: string,
    page: string,
    testCaseSheetId: string,
    dataById: Map<string, Record<string, unknown>>
): Promise<void> {

    const context = `${module}/${page}`;

    const caseRows = await getSheetValues(testCaseSheetId, page);

    const testCases = toRecords(caseRows).map(row => toTestCase(row, dataById, context));

    assertUniqueTcIds(testCases, context);

    for (const [subModule, group] of groupBySubModule(testCases)) {

        writeTestCases(module, subModule, page, group);

    }

}

async function syncModule(module: string): Promise<void> {

    const { testCaseSheetId, testDataSheetId } = Environment.getModuleSheetIds(module);

    const [pages, dataTabTitles] = await Promise.all([
        listSheetTitles(testCaseSheetId),
        listSheetTitles(testDataSheetId)
    ]);

    const dataById = await loadDataById(testDataSheetId, dataTabTitles, module);

    for (const page of pages) {

        console.log(`  ${module}/${page}`);
        await syncTab(module, page, testCaseSheetId, dataById);

    }

}

async function main(): Promise<void> {

    for (const module of SHEET_MODULES) {

        console.log(`Syncing ${module}...`);
        await syncModule(module);

    }

    console.log("Sync complete.");

}

main().catch(error => {

    console.error(error);
    process.exitCode = 1;

});
