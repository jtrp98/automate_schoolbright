import { RunMode } from "../core/types";

export interface RunConfig {
  mode: RunMode;

  domain?: string;

  module?: string;

  page?: string;

  tags?: string[];

  headed?: boolean;

  retry?: number;

  timeout?: number;
}

export const DefaultRunConfig: RunConfig = {
  mode: "NORMAL",
  headed: false,
  retry: 0,
  timeout: 30000
};