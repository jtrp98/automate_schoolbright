export type RunMode = "normal" | "smoke" | "regression" | "full";

export interface TestCase {
  tcId: string;
  expected: string;
  function: string;
  mode: RunMode;
  dataId: string;
  enable: boolean;
  subModule: string;
}

export interface TestData {
  dataId: string;
  values: Record<string, unknown>;
}

export interface ExecutionResult {
  success: boolean;
  message: string;
}
