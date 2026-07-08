import type { Page } from "@playwright/test";
import type { BaseAction } from "../action/baseaction";

export type RunMode = "normal" | "smoke" | "regression" | "full";

export interface TestCase {

    tcId: string;                       // TC_ID

    expected: string;                   // Expected

    function: string;                   // Function (key in ExecutorMap)

    mode: RunMode;                      // Mode

    dataId: string;                     // Data_ID

    enable: boolean;                    // Enable

    subModule: string;                  // SubModule

    module: string;                     // Derived from the sheet file / data folder name

    page: string;                       // Derived from the sheet tab / data file name

    data: Record<string, unknown>;      // Resolved from Data_ID by the Loader

}

export interface ExecutionContext {

    page: Page;

    action: BaseAction;

}

export type Workflow = (

    ctx: ExecutionContext,
    tc: TestCase

) => Promise<void>;

export type ExecutorMap = Record<string, Workflow>;
