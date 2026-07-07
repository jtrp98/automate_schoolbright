import { RunMode } from "../core/types";

export type EnvironmentMode = "dev" | "uat" | "prod";

export interface RunConfig {
  runmode: RunMode;
  mode: EnvironmentMode;
  module: string;
  submodule?: string;
  page: string;
  headed?: boolean;
  retry?: number;
  timeout?: number;
}

export const DefaultRunConfig: Omit<RunConfig, "module" | "page"> = {
  runmode: "normal",
  mode: "dev",
  headed: false,
  retry: 0,
  timeout: 30000,
};
