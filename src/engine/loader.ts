import { GoogleSheetClient } from "../connectors/google-sheet.client";
import { Environment } from "../config/environment";


export class Loader {


    private sheetClient: GoogleSheetClient;


    constructor(){

        this.sheetClient =
            new GoogleSheetClient();

    }



    async loadTestCase(
        sheetName:string
    ){


        const rows =
            await this.sheetClient.getSheetData(
                Environment.TESTCASE_SHEET_ID,
                sheetName
            );


        const headers =
            rows[0];


        return rows
            .slice(1)
            .map(row => {


                const obj:any = {};


                headers.forEach(
                    (header,index)=>{

                        obj[header] =
                            row[index];

                    }
                );


                return obj;

            });


    }



    async loadTestData(
        sheetName:string
    ){


        const rows =
            await this.sheetClient.getSheetData(
                Environment.TESTDATA_SHEET_ID,
                sheetName
            );


        const headers =
            rows[0];


        return rows
            .slice(1)
            .map(row => {


                const obj:any = {};


                headers.forEach(
                    (header,index)=>{

                        obj[header] =
                            row[index];

                    }
                );


                return obj;

            });


    }


}