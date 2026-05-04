export function getConfigSchema() {
    return {
        fields: [
            {
                key: "command",
                label: "Kilo command",
                type: "text",
                default: "kilo",
                hint: "CLI command used to launch Kilo Code.",
            },
            {
                key: "cwd",
                label: "Working directory",
                type: "text",
                default: "",
                hint: "Absolute path for Kilo runs. Leave empty to use the agent runtime workspace.",
            },
            {
                key: "configDir",
                label: "Config directory",
                type: "text",
                default: "",
                hint: "Optional override for the Kilo config directory, usually ~/.config/kilo.",
            },
            {
                key: "promptTemplate",
                label: "Prompt template",
                type: "textarea",
                default: "{{prompt}}",
                hint: "Template used to feed the Paperclip task into Kilo's autonomous run mode.",
            },
            {
                key: "timeoutSec",
                label: "Timeout seconds",
                type: "number",
                default: 1800,
                hint: "Maximum time to wait for one Kilo run before Paperclip stops it.",
            },
            {
                key: "graceSec",
                label: "Grace seconds",
                type: "number",
                default: 30,
                hint: "How long Paperclip waits after SIGTERM before forcing shutdown.",
            },
        ],
    };
}
