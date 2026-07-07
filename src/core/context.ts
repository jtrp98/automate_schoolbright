import { Page } from "@playwright/test";
import { BaseAction } from "../action/baseaction";

export interface ExecutionContext {
  page: Page;
  action: BaseAction;
}
