import type { CandidateSpec, InspectContainer } from "./safe-deploy.d.mts";

export const PROD_ADMIN_24_EXPECTATIONS: Readonly<Record<string, unknown>>;
export function preflightProductionSwitch(engine: Record<string, unknown>, options: Record<string, unknown>): Promise<{ expected: Record<string, unknown>; source: InspectContainer; writers: Array<{ name: string; id: string }> }>;
export function switchProduction(engine: Record<string, unknown>, options: Record<string, unknown> & { healthCheck: () => Promise<void> }): Promise<{ candidateId: string; sourceId: string; spec: CandidateSpec; restoredWriters: number }>;
