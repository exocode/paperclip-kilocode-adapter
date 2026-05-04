export const type = "kilocode_local";
export const label = "Kilo Code (local)";
export const models = [];
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
- promptTemplate (string, optional): prompt template used for autonomous runs
- configDir (string, optional): overrides the Kilo config directory when needed
- env (object, optional): KEY=VALUE environment variables

Operational fields:
- timeoutSec (number, optional): run timeout in seconds
- graceSec (number, optional): SIGTERM grace period in seconds

Notes:
- Kilo CLI 1.0 uses \`kilo\`, \`kilo run\`, \`kilo upgrade\`, and \`kilo --continue\`.
- Kilo configuration is stored under \`~/.config/kilo/\`.
- The adapter intentionally keeps prompts simple and non-prescriptive so Paperclip can supply the work context.
`;
export { createServerAdapter } from "./server/index.js";
