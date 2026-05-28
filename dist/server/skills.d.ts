export type AdapterSkillSyncMode = "unsupported" | "persistent" | "ephemeral";
export type AdapterSkillState = "available" | "configured" | "installed" | "missing" | "stale" | "external";
export type AdapterSkillOrigin = "company_managed" | "paperclip_required" | "user_installed" | "external_unknown";
export interface AdapterSkillContext {
    agentId: string;
    companyId: string;
    adapterType: string;
    config: Record<string, unknown>;
}
export interface AdapterSkillEntry {
    key: string;
    runtimeName: string | null;
    desired: boolean;
    managed: boolean;
    required?: boolean;
    requiredReason?: string | null;
    state: AdapterSkillState;
    origin?: AdapterSkillOrigin;
    originLabel?: string | null;
    locationLabel?: string | null;
    readOnly?: boolean;
    sourcePath?: string | null;
    targetPath?: string | null;
    detail?: string | null;
}
export interface AdapterSkillSnapshot {
    adapterType: string;
    supported: boolean;
    mode: AdapterSkillSyncMode;
    desiredSkills: string[];
    entries: AdapterSkillEntry[];
    warnings: string[];
}
export declare function resolveKiloSkillsHome(config: Record<string, unknown>): string;
export declare function resolveKiloDesiredSkillNames(config: Record<string, unknown>, availableEntries: Array<{
    key: string;
    runtimeName?: string | null;
    required?: boolean;
}>): string[];
export declare function listKiloSkills(ctx: AdapterSkillContext): Promise<AdapterSkillSnapshot>;
export declare function syncKiloSkills(ctx: AdapterSkillContext, desiredSkills: string[]): Promise<AdapterSkillSnapshot>;
export declare function ensureKiloSkillsInjected(config: Record<string, unknown>, onLog: (stream: "stdout" | "stderr", chunk: string) => Promise<void>): Promise<void>;
//# sourceMappingURL=skills.d.ts.map