export const RUN_MODE = {
  NORMAL: "normal",
  SMOKE: "smoke",
  REGRESSION: "regression",
  FULL: "full",
} as const;

export const MODULES = [
  "login",
  "personal-info",
  "academic",
  "student-affairs",
  "general-admin",
  "accounting",
  "store",
  "report",
  "initial-setup",
] as const;

export const SHEET_COLUMNS = {
  TC_ID: "TC_ID",
  EXPECTED: "Expected",
  FUNCTION: "Function",
  MODE: "Mode",
  DATA_ID: "Data_ID",
  ENABLE: "Enable",
  SUB_MODULE: "SubModule",
} as const;
