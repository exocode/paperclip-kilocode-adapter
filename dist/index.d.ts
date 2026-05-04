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
export declare const agentConfigurationDoc = "# kilocode_local agent configuration\n\nAdapter: kilocode_local\n\nUse when:\n- You want Paperclip to run Kilo Code locally as the agent runtime\n- You want to orchestrate Kilo via the current CLI entrypoint: `kilo`\n- You want to run heartbeats with Kilo's autonomous mode using `kilo run --auto`\n- You need a Paperclip adapter that can resume and monitor Kilo sessions across heartbeats\n\nDon't use when:\n- You need webhook-style external invocation (use `openclaw_gateway` or `http`)\n- You only need a one-shot shell command (use `process`)\n- Kilo CLI is not installed or not on `PATH`\n\nCore fields:\n- cwd (string, optional): absolute working directory for the adapter process\n- command (string, optional): defaults to \"kilo\"\n- runArgs (string[], optional): extra arguments passed to `kilo run`\n- model (string, optional): Kilo model id in provider/model format, for example `kilo/kilo-auto/balanced` or `kilo/openai/gpt-5.5`\n- variant (string, optional): provider-specific model variant or reasoning effort passed to `kilo run --variant`\n- promptTemplate (string, optional): prompt template used for autonomous runs\n- configDir (string, optional): overrides the Kilo config directory when needed\n- dangerouslySkipPermissions (boolean, optional): pass Kilo's `--dangerously-skip-permissions` flag for fully unattended runs\n- env (object, optional): KEY=VALUE environment variables\n\nOperational fields:\n- timeoutSec (number, optional): run timeout in seconds\n- graceSec (number, optional): SIGTERM grace period in seconds\n\nNotes:\n- Kilo CLI 1.0 uses `kilo`, `kilo run`, `kilo upgrade`, and `kilo --continue`.\n- Kilo configuration is stored under `~/.config/kilo/`.\n- The adapter intentionally keeps prompts simple and non-prescriptive so Paperclip can supply the work context.\n";
export { createServerAdapter } from "./server/index.js";
//# sourceMappingURL=index.d.ts.map