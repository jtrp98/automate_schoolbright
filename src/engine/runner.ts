import type { TestCase } from "../core/types";

export function screenshotName(tc: TestCase, suffix: string): string {

    return `${tc.tcId}-${suffix}`.replace(/[^a-zA-Z0-9-_]/g, "_");

}

export function logStart(tc: TestCase): void {

    console.log(`[${new Date().toISOString()}] > ${tc.tcId} started`);

}

export function logEnd(tc: TestCase, durationMs: number): void {

    console.log(`[${new Date().toISOString()}] < ${tc.tcId} finished in ${durationMs}ms`);

}
