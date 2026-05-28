export declare const type = "kilocode_local";
export declare const label = "Kilo Code (local)";
export declare const DEFAULT_KILOCODE_LOCAL_MODEL = "kilo/kilo-auto/balanced";
export declare const models: Array<{
    id: string;
    label: string;
}>;
export declare const modelProfiles: Array<{
    key: string;
    label: string;
    description?: string;
    adapterConfig: Record<string, unknown>;
    source?: string;
}>;
export declare const agentConfigurationDoc: string;
export { createServerAdapter } from "./server/index.js";
//# sourceMappingURL=index.d.ts.map