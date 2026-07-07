import { Page } from "@playwright/test";
import { RunConfig } from "./types";

export interface ExecutionContext {
  page: Page;
  config: RunConfig;
}