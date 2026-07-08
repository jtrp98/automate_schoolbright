import type { TestCase } from "../core/types";

export function screenshotName(tc: TestCase, suffix: string): string {

    return `${tc.tcId}-${suffix}`.replace(/[^a-zA-Z0-9-_]/g, "_");

}
