import dotenv from "dotenv";

dotenv.config();

export const Environment = {
    BYPASS: process.env.BYPASS,
    SYSTEM_URL: process.env.SYSTEM_URL || "",

    ACADEMIC_URL: process.env.ACADEMIC_URL || "",

    USERNAME: process.env.USERNAME || "",

    PASSWORD: process.env.PASSWORD || "",

    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID || "",

    GOOGLE_SERVICE_ACCOUNT_PATH: process.env.GOOGLE_SERVICE_ACCOUNT_PATH || "",

    TESTCASE_SHEET_ID:"13Wj2LhWw9WVUQdsRXR9z4Dfq6YLXj1g4ixD1ukRPFqc",

    TESTDATA_SHEET_ID:"1PzvocIRo22B0_YLBg6h0AisiKtHsfKncsCqf4h2D79I"
};