import dotenv from "dotenv";

dotenv.config();

export type SheetModule =
    | "personal-info"
    | "academic"
    | "student-affairs"
    | "general-admin"
    | "accounting"
    | "store"
    | "report"
    | "initial-setup";

export interface ModuleSheetIds {
    testCaseSheetId: string;
    testDataSheetId: string;
}

function readModuleSheetIds(envPrefix: string): ModuleSheetIds {

    return {
        testCaseSheetId: process.env[`${envPrefix}_TESTCASE_SHEET_ID`] || "",
        testDataSheetId: process.env[`${envPrefix}_TESTDATA_SHEET_ID`] || ""
    };

}

// One Google Sheet file pair (test case + test data) per business module.
// "login" has no sheet of its own — its cases/data live in the personal-info sheets.
const MODULE_SHEET_IDS: Record<SheetModule, ModuleSheetIds> = {
    "personal-info": readModuleSheetIds("PERSONAL_INFO"),
    "academic": readModuleSheetIds("ACADEMIC"),
    "student-affairs": readModuleSheetIds("STUDENT_AFFAIRS"),
    "general-admin": readModuleSheetIds("GENERAL_ADMIN"),
    "accounting": readModuleSheetIds("ACCOUNTING"),
    "store": readModuleSheetIds("STORE"),
    "report": readModuleSheetIds("REPORT"),
    "initial-setup": readModuleSheetIds("INITIAL_SETUP")
};

const LOGIN_SHEET_ALIAS: SheetModule = "personal-info";

export const Environment = {
    BYPASS: process.env.BYPASS,
    SYSTEM_URL: process.env.SYSTEM_URL || "",

    ACADEMIC_URL: process.env.ACADEMIC_URL || "",
    GOOGLE_SERVICE_ACCOUNT_PATH: process.env.GOOGLE_SERVICE_ACCOUNT_PATH || "",

    getModuleSheetIds(module: string): ModuleSheetIds {

        const resolvedModule = module === "login" ? LOGIN_SHEET_ALIAS : module as SheetModule;
        const sheetIds = MODULE_SHEET_IDS[resolvedModule];

        if (!sheetIds) {

            throw new Error(
                `No Google Sheet configured for module "${module}"`
            );

        }

        return sheetIds;

    }
};
