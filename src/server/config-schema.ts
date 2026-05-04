import { DEFAULT_KILOCODE_LOCAL_MODEL, models } from "../index.js";

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
        key: "model",
        label: "Kilo model",
        type: "select",
        default: DEFAULT_KILOCODE_LOCAL_MODEL,
        options: models.map((model) => ({ value: model.id, label: model.label })),
        required: true,
        hint: "Choose the exact Kilo model Paperclip should pass to `kilo run --model`.",
      },
      {
        key: "variant",
        label: "Variant",
        type: "text",
        default: "",
        hint: "Optional Kilo variant passed to `kilo run --variant`.",
      },
      {
        key: "dangerouslySkipPermissions",
        label: "Skip permissions in unattended runs",
        type: "toggle",
        default: true,
        hint: "Passes `--dangerously-skip-permissions` so headless Paperclip runs do not stall.",
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
