export const type = "kilocode_local";
export const label = "Kilo Code (local)";
export const DEFAULT_KILOCODE_LOCAL_MODEL = "kilo/kilo-auto/balanced";
export const models = [
    { id: DEFAULT_KILOCODE_LOCAL_MODEL, label: "Kilo Auto Balanced" },
    { id: "kilo/kilo-auto/frontier", label: "Kilo Auto Frontier" },
    { id: "kilo/kilo-auto/small", label: "Kilo Auto Small" },
    { id: "kilo/openai/gpt-5.5", label: "OpenAI GPT-5.5" },
    { id: "kilo/openai/gpt-5.4", label: "OpenAI GPT-5.4" },
    { id: "kilo/openai/gpt-5.4-mini", label: "OpenAI GPT-5.4 Mini" },
    { id: "kilo/openai/gpt-5.3-codex", label: "OpenAI GPT-5.3 Codex" },
    { id: "kilo/anthropic/claude-opus-4.7", label: "Claude Opus 4.7" },
    { id: "kilo/anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
    { id: "kilo/google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview" },
];
export const modelProfiles = [];
export const agentConfigurationDoc = `# kilocode_local agent configuration

Adapter: kilocode_local

Use when:
- You want Paperclip to run Kilo Code locally as the agent runtime
- You want to orchestrate Kilo via the current CLI entrypoint: \`kilo\`
- You want to run heartbeats with Kilo's autonomous mode using \`kilo run --auto\`
- You need a Paperclip adapter that can resume and monitor Kilo sessions across heartbeats

Don't use when:
- You need webhook-style external invocation (use \`openclaw_gateway\` or \`http\`)
- You only need a one-shot shell command (use \`process\`)
- Kilo CLI is not installed or not on \`PATH\`

Core fields:
- cwd (string, optional): absolute working directory for the adapter process
- command (string, optional): defaults to \"kilo\"
- runArgs (string[], optional): extra arguments passed to \`kilo run\`
- model (string, optional): Kilo model id in provider/model format, for example \`kilo/kilo-auto/balanced\` or \`kilo/openai/gpt-5.5\`
- variant (string, optional): provider-specific model variant or reasoning effort passed to \`kilo run --variant\`
- promptTemplate (string, optional): prompt template used for autonomous runs
- configDir (string, optional): overrides the Kilo config directory when needed
- dangerouslySkipPermissions (boolean, optional): pass Kilo's \`--dangerously-skip-permissions\` flag for fully unattended runs
- env (object, optional): KEY=VALUE environment variables

Operational fields:
- timeoutSec (number, optional): run timeout in seconds
- graceSec (number, optional): SIGTERM grace period in seconds

Notes:
- Kilo CLI 7.x uses \`kilo run --auto\` for autonomous/pipeline usage. The \`-c\`/\`--continue\` flag resumes the last session, \`--session <id>\` resumes a specific session.
- Kilo configuration is stored under \`~/.config/kilo/\`.
- The adapter intentionally keeps prompts simple and non-prescriptive so Paperclip can supply the work context.
`;
export { createServerAdapter } from "./server/index.js";
