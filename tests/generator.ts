import { test } from "@playwright/test";
import { Loader } from "../src/engine/loader";
import { LoginExecutor } from "../src/modules/login/login.excecutor";


export async function generateTests() {


    const loader =
        new Loader();



    const testCases =
        await loader.loadTestCase(
            "Login"
        );


    const testData =
        await loader.loadTestData(
            "Login_Data"
        );

    for (const tc of testCases) {


        if (tc.Enable !== "TRUE")
            continue;

        test(`${tc.TC_ID} - ${tc.Expected}`, async ({ page }) => {

            const executor = new LoginExecutor();

            let data: any = null;

            if (tc.Data_ID !== "-") {

                data = testData.find(x => x.Data_ID === tc.Data_ID);

            }

            await executor.execute(
                page,
                {
                    mode: tc.Mode,
                    school: data?.School,
                    username: data?.Username,
                    password: data?.Password,
                    expected: data?.Expected
                }
            );


        }
        );


    }

}