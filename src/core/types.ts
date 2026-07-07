export type RunMode =
  | "SMOKE"
  | "NORMAL"
  | "HAPPY_FLOW"
  | "FULL"
  | "DOMAIN"
  | "DEBUG";

export type FunctionType =
  | "SEARCH"
  | "EXPORT"
  | "PRINT"
  | "LOGIN"
  | "CREATE"
  | "UPDATE"
  | "DELETE";

export interface TestCase {
  id: string;
  module: string;
  page: string;
  function: FunctionType;
  dataId: string;
  pattern?: string;
  tag?: string;
  enable: boolean;
}

export interface TestData {
  id: string;
  values: Record<string, unknown>;
}

export interface RunConfig {
  mode: RunMode;
  domains?: string[];
  pages?: string[];
  tags?: string[];
}

export interface ExecutionResult {
  success: boolean;
  message?: string;
}