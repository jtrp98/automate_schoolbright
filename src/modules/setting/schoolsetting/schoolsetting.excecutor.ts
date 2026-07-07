import { Executor } from "../../../core/interfaces";
import { ExecutionContext } from "../../../core/context";
import {
    TestCase,
    TestData,
    ExecutionResult
} from "../../../core/types";

import { SchoolSettingPage }
    from "../../../pages/setting/schoolsetting/schoolsetting.page";


export class SchoolSettingExecutor
    implements Executor {


    async execute(context: ExecutionContext, testCase: TestCase, data: TestData): Promise<ExecutionResult> {


        const schoolSettingPage =
            new SchoolSettingPage(
                context.page
            );


        await schoolSettingPage.goto();


        if (data.values.schoolName) {

            await schoolSettingPage.fillSchoolName(
                String(data.values.schoolName)
            );

        }


        await schoolSettingPage.clickSave();



        return {

            success: true,

            message:
                "School setting updated"

        };

    }

}