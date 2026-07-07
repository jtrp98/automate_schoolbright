import { google, sheets_v4 } from "googleapis";
import fs from "fs";
import { Environment } from "../config/environment";

let sheetsClient: sheets_v4.Sheets | undefined;

function getSheetsClient(): sheets_v4.Sheets {

    if (sheetsClient) {

        return sheetsClient;

    }

    const credentials = JSON.parse(
        fs.readFileSync(Environment.GOOGLE_SERVICE_ACCOUNT_PATH, "utf8")
    );

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    });

    sheetsClient = google.sheets({ version: "v4", auth });

    return sheetsClient;

}

export async function listSheetTitles(spreadsheetId: string): Promise<string[]> {

    const response = await getSheetsClient().spreadsheets.get({
        spreadsheetId,
        fields: "sheets.properties.title"
    });

    return (response.data.sheets ?? [])
        .map(sheet => sheet.properties?.title)
        .filter((title): title is string => Boolean(title));

}

export async function getSheetValues(spreadsheetId: string, range: string): Promise<string[][]> {

    const response = await getSheetsClient().spreadsheets.values.get({
        spreadsheetId,
        range
    });

    return (response.data.values ?? []) as string[][];

}
