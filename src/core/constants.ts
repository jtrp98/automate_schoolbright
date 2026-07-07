export const SHEET_COLUMNS = {
    TC_ID: "TC_ID",
    EXPECTED: "Expected",
    FUNCTION: "Function",
    MODE: "Mode",
    DATA_ID: "Data_ID",
    ENABLE: "Enable",
    SUB_MODULE: "SubModule",
} as const;

export const SHEET_MODULES = [
    "personal-info",
    "academic",
    "student-affairs",
    "general-admin",
    "accounting",
    "store",
    "report",
    "initial-setup",
] as const;

export const RUN_MODES = ["normal", "smoke", "regression", "full"] as const;

export const DATA_DIR = "src/data";

export const TIMEOUTS = {
    MODAL: 3_000,
    NAVIGATION: 30_000,
} as const;
