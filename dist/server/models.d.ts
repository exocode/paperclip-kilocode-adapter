export declare const DEFAULT_KILOCODE_LOCAL_MODEL = "kilo/kilo-auto/balanced";
export declare const fallbackModels: Array<{
    id: string;
    label: string;
}>;
export declare function parseKiloModelsOutput(output: string): Array<{
    id: string;
    label: string;
}>;
export declare function listKiloModels(command?: string): Promise<Array<{
    id: string;
    label: string;
}>>;
//# sourceMappingURL=models.d.ts.map