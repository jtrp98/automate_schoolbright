import { GoogleSheetClient } from "../connectors/google-sheet.client";
import { Environment } from "../config/environment";
import { SHEET_COLUMNS } from "../core/constants";
import { RunMode, TestCase, TestData } from "../core/types";

export class Loader {

    private readonly sheetClient: GoogleSheetClient;

    constructor() {

        this.sheetClient = new GoogleSheetClient();

    }

    async loadTestCases(module: string, page: string, subModule?: string): Promise<TestCase[]> {

        const { testCaseSheetId } = Environment.getModuleSheetIds(module);

        const rows = await this.sheetClient.getSheetData(
            testCaseSheetId,
            page
        );

        const testCases = this.toRecords(rows).map(row => this.toTestCase(row));

        if (!subModule) {

            return testCases;

        }

        return testCases.filter(testCase => testCase.subModule === subModule);

    }

    async loadTestData(module: string, page: string): Promise<TestData[]> {

        const { testDataSheetId } = Environment.getModuleSheetIds(module);

        const rows = await this.sheetClient.getSheetData(
            testDataSheetId,
            page
        );

        return this.toRecords(rows).map(row => this.toTestData(row));

    }

    private toRecords(rows: string[][]): Record<string, string>[] {

        const headers = rows[0] ?? [];

        return rows.slice(1).map(row => {

            const record: Record<string, string> = {};

            headers.forEach((header, index) => {

                record[header] = row[index] ?? "";

            });

            return record;

        });

    }

    private toTestCase(row: Record<string, string>): TestCase {

        return {
            tcId: row[SHEET_COLUMNS.TC_ID],
            expected: row[SHEET_COLUMNS.EXPECTED],
            function: row[SHEET_COLUMNS.FUNCTION],
            mode: row[SHEET_COLUMNS.MODE].toLowerCase() as RunMode,
            dataId: row[SHEET_COLUMNS.DATA_ID],
            enable: row[SHEET_COLUMNS.ENABLE].toUpperCase() === "TRUE",
            subModule: row[SHEET_COLUMNS.SUB_MODULE]
        };

    }

    private toTestData(row: Record<string, string>): TestData {

        const dataId = row[SHEET_COLUMNS.DATA_ID];
        const values: Record<string, unknown> = { ...row };

        delete values[SHEET_COLUMNS.DATA_ID];

        return {
            dataId,
            values
        };

    }

}
