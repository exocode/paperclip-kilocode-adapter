export declare function getConfigSchema(): {
    fields: ({
        key: string;
        label: string;
        type: string;
        default: string;
        hint: string;
        options?: never;
        required?: never;
    } | {
        key: string;
        label: string;
        type: string;
        default: string;
        options: {
            value: string;
            label: string;
        }[];
        required: boolean;
        hint: string;
    } | {
        key: string;
        label: string;
        type: string;
        default: boolean;
        hint: string;
        options?: never;
        required?: never;
    } | {
        key: string;
        label: string;
        type: string;
        default: number;
        hint: string;
        options?: never;
        required?: never;
    })[];
};
//# sourceMappingURL=config-schema.d.ts.map