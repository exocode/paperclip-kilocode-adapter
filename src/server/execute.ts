import { spawn } from "node:child_process";
import type { AdapterExecutionContext, AdapterExecutionResult } from "@paperclipai/adapter-utils";
import { ensureKiloSkillsInjected } from "./skills.js";

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function buildPaperclipEnv(agent: AdapterExecutionContext["agent"]): Record<string, string> {
  return {
    PAPERCLIP_AGENT_ID: agent.id,
    PAPERCLIP_COMPANY_ID: agent.companyId,
    PAPERCLIP_AGENT_NAME: agent.name,
    PAPERCLIP_ADAPTER_TYPE: agent.adapterType ?? "",
  };
}

function renderTemplate(template: string, values: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const value = values[key];
    return typeof value === "string" || typeof value === "number" ? String(value) : "";
  });
}

function buildPrompt(ctx: AdapterExecutionContext): string {
  const promptTemplate = asString(ctx.config.promptTemplate, "{{prompt}}");
  const basePrompt = typeof ctx.context.prompt === "string" && ctx.context.prompt.trim().length > 0
    ? ctx.context.prompt.trim()
    : `Continue the current Paperclip task for ${ctx.agent.name}.`;

  return renderTemplate(promptTemplate, {
    prompt: basePrompt,
    agentId: ctx.agent.id,
    agentName: ctx.agent.name,
    companyId: ctx.agent.companyId,
    runId: ctx.runId,
    taskId: typeof ctx.context.taskId === "string" ? ctx.context.taskId : "",
    taskTitle: typeof ctx.context.taskTitle === "string" ? ctx.context.taskTitle : "",
  });
}

function normalizeEnv(input: unknown): Record<string, string> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return {};
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof value === "string") env[key] = value;
  }
  return env;
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const command = asString(ctx.config.command, "kilo");
  const cwd = asString(ctx.config.cwd, process.cwd());
  const timeoutSec = asNumber(ctx.config.timeoutSec, 1800);
  const graceSec = asNumber(ctx.config.graceSec, 30);
  const configDir = asString(ctx.config.configDir, "").trim();
  const model = asString(ctx.config.model, "").trim();
  const variant = asString(ctx.config.variant, "").trim();
  const runArgs = asStringArray(ctx.config.runArgs);
  const dangerouslySkipPermissions = asBoolean(ctx.config.dangerouslySkipPermissions, false);
  const envConfig = normalizeEnv(parseObject(ctx.config.env));
  const env = {
    ...buildPaperclipEnv(ctx.agent),
    ...envConfig,
  };

  if (configDir) {
    env.KILO_CONFIG_DIR = configDir;
  }

  await ensureKiloSkillsInjected(ctx.config, ctx.onLog);

  const prompt = buildPrompt(ctx);
  const args = ["run", "--auto"];
  if (dangerouslySkipPermissions) args.push("--dangerously-skip-permissions");
  if (model) args.push("--model", model);
  if (variant) args.push("--variant", variant);
  args.push(...runArgs, prompt);

  await ctx.onMeta?.({
    adapterType: ctx.agent.adapterType ?? "kilocode_local",
    command,
    cwd,
    commandArgs: args,
    context: {
      hasPromptTemplate: Boolean(ctx.config.promptTemplate),
      configDir: configDir || null,
      model: model || null,
      variant: variant || null,
      dangerouslySkipPermissions,
    },
  });

  return await new Promise<AdapterExecutionResult>((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timeoutHandle = timeoutSec > 0
      ? setTimeout(() => {
          timedOut = true;
          child.kill("SIGTERM");
          setTimeout(() => child.kill("SIGKILL"), graceSec * 1000);
        }, timeoutSec * 1000)
      : null;

    child.stdout?.on("data", async (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      stdout += text;
      await ctx.onLog("stdout", text);
    });
    child.stderr?.on("data", async (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      stderr += text;
      await ctx.onLog("stderr", text);
    });
    child.on("error", async (err) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      const message = err instanceof Error ? err.message : String(err);
      stderr += message;
      await ctx.onLog("stderr", `${message}\n`);
      resolve({
        exitCode: 1,
        signal: null,
        timedOut: false,
        errorMessage: message,
        sessionDisplayId: null,
        sessionParams: null,
        resultJson: { stdout, stderr },
      });
    });
    child.on("close", (code, sig) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      resolve({
        exitCode: code,
        signal: sig,
        timedOut,
        sessionDisplayId: null,
        sessionParams: null,
        provider: model.includes("/") ? model.split("/")[1] ?? "kilo" : "kilo",
        model: model || null,
        summary: stdout.trim().slice(0, 500),
        resultJson: { stdout, stderr, command, args },
      });
    });
  });
}
