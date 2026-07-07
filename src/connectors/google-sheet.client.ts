import { Environment } from "../config/environment";
import { google } from "googleapis";
import fs from "fs";

export class GoogleSheetClient {


    private sheets;


    constructor() {


        const credentials =
            JSON.parse(
                fs.readFileSync(
                    Environment.GOOGLE_SERVICE_ACCOUNT_PATH,
                    "utf8"
                )
            );



        const auth =
            new google.auth.GoogleAuth({
                credentials,
                scopes:[
                    "https://www.googleapis.com/auth/spreadsheets.readonly"
                ]

            });



        this.sheets =
            google.sheets({
                version:"v4",
                auth
            });

    }



    async getSheetData(
        spreadsheetId:string,
        range:string
    ){


        const response =
            await this.sheets.spreadsheets.values.get({

                spreadsheetId,

                range

            });



        return response.data.values ?? [];

    }

}