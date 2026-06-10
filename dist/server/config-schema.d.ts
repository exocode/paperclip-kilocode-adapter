export declare function getConfigSchema(): {
    fields: ({
        key: string;
        label: string;
        type: "text";
        default: string;
        hint: string;
        options?: never;
        required?: never;
    } | {
        key: string;
        label: string;
        type: "select";
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
        type: "toggle";
        default: boolean;
        hint: string;
        options?: never;
        required?: never;
    } | {
        key: string;
        label: string;
        type: "textarea";
        default: string;
        hint: string;
        options?: never;
        required?: never;
    } | {
        key: string;
        label: string;
        type: "number";
        default: number;
        hint: string;
        options?: never;
        required?: never;
    })[];
};
//# sourceMappingURL=config-schema.d.ts.map