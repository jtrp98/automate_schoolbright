import { expect } from "@playwright/test";
import type { ExecutorMap } from "../../../../core/types";
import { SchoolsettingPage } from "./schoolsetting.page";

interface SchoolSettingData {
    ScanOut?: string;
    ClassNameDisable?: string;
    expected?: string;
}

export const executor: ExecutorMap = {

    async UpdateSetting(ctx, tc) {

        const { ScanOut, ClassNameDisable, expected } = tc.data as SchoolSettingData;
        const schoolsettingPage = new SchoolsettingPage(ctx.page, ctx.action);

        await schoolsettingPage.goto();

        if (ScanOut) {
            await schoolsettingPage.setScanOut(ScanOut.toLowerCase() === "true");
        }

        if (ClassNameDisable) {
            await schoolsettingPage.setClassNameDisable(ClassNameDisable.toLowerCase() === "true");
        }

        await schoolsettingPage.submit();

        expect(await schoolsettingPage.hasResultMessage(expected ?? ""), `${tc.tcId}: expected result message "${expected}"`).toBe(true);

    }

};
