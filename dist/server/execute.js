import { spawn } from "node:child_process";
import { ensureKiloSkillsInjected } from "./skills.js";
function asString(value, fallback) {
    return typeof value === "string" && value.length > 0 ? value : fallback;
}
function asNumber(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function asBoolean(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
}
function asStringArray(value) {
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}
function parseObject(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return {};
    }
    return value;
}
function buildPaperclipEnv(agent) {
    // Resolve the API URL the same way the official adapter-utils does:
    // prefer the runtime env var, fall back to localhost:3100.
    const runtimeHost = (process.env.PAPERCLIP_LISTEN_HOST ?? process.env.HOST ?? "localhost").trim()
        .replace(/^(.+:.+)$/, "[$1]") // bracket bare IPv6
        .replace(/^(0\.0\.0\.0|::)$/, "localhost");
    const runtimePort = process.env.PAPERCLIP_LISTEN_PORT ?? process.env.PORT ?? "3100";
    const apiUrl = process.env.PAPERCLIP_RUNTIME_API_URL ??
        process.env.PAPERCLIP_API_URL ??
        `http://${runtimeHost}:${runtimePort}`;
    return {
        PAPERCLIP_AGENT_ID: agent.id,
        PAPERCLIP_COMPANY_ID: agent.companyId,
        PAPERCLIP_AGENT_NAME: agent.name,
        PAPERCLIP_ADAPTER_TYPE: agent.adapterType ?? "",
        PAPERCLIP_API_URL: apiUrl,
        PAPERCLIP_RUNTIME_API_URL: apiUrl,
    };
}
function renderTemplate(template, values) {
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key) => {
        const value = values[key];
        return typeof value === "string" || typeof value === "number" ? String(value) : "";
    });
}
function buildPrompt(ctx) {
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
function normalizeEnv(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input))
        return {};
    const env = {};
    for (const [key, value] of Object.entries(input)) {
        if (typeof value === "string") {
            // plain string (e.g. PAPERCLIP_API_KEY injected by registry)
            env[key] = value;
        }
        else if (typeof value === "object" &&
            value !== null &&
            "value" in value &&
            typeof value["value"] === "string") {
            // structured env format: { type: "plain", value: "..." }
            env[key] = value["value"];
        }
    }
    return env;
}
/**
 * Build a PATH that includes Homebrew bin dirs so that `kilo` can be found
 * even when Paperclip Desktop (Electron) starts with a minimal environment.
 */
function resolvedEnv(extraEnv) {
    const home = process.env["HOME"] ?? "";
    const brewPaths = [
        "/opt/homebrew/opt/node@22/bin",
        "/opt/homebrew/bin",
        "/opt/homebrew/sbin",
        "/usr/local/bin",
        // /paperclip/kilo persistent wrapper — survives container restarts
        "/paperclip",
        // ~/kilo fallback — works inside Docker where $HOME is mounted
        ...(home ? [home] : []),
    ];
    // prefer PATH from agent config, then process.env, then fallback
    const base = extraEnv["PATH"] ?? process.env["PATH"] ?? "/usr/bin:/bin:/usr/sbin:/sbin";
    const parts = base.split(":").filter(Boolean);
    for (const p of brewPaths.reverse()) {
        if (!parts.includes(p))
            parts.unshift(p);
    }
    return { ...process.env, ...extraEnv, PATH: parts.join(":") };
}
export async function execute(ctx) {
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
    // Inject run-scoped vars from execution context (mirrors codex-local behaviour).
    // PAPERCLIP_RUN_ID is always set; PAPERCLIP_API_KEY is set from authToken only
    // when the config.env block does not already supply an explicit key.
    env.PAPERCLIP_RUN_ID = ctx.runId;
    if (!envConfig.PAPERCLIP_API_KEY && ctx.authToken) {
        env.PAPERCLIP_API_KEY = ctx.authToken;
    }
    if (configDir) {
        env.KILO_CONFIG_DIR = configDir;
    }
    await ensureKiloSkillsInjected(ctx.config, ctx.onLog);
    const prompt = buildPrompt(ctx);
    const args = ["run", "--auto", "--format", "json"];
    if (dangerouslySkipPermissions)
        args.push("--dangerously-skip-permissions");
    if (model)
        args.push("--model", model);
    if (variant)
        args.push("--variant", variant);
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
    // Accumulate token usage and cost from kilo --format json step_finish events.
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCachedInputTokens = 0;
    let totalCostUsd = 0;
    function parseStepFinishTokens(line) {
        try {
            const obj = JSON.parse(line);
            if (obj.type !== "step_finish")
                return;
            const part = obj.part;
            if (!part)
                return;
            const tokens = part.tokens;
            if (tokens) {
                const cache = tokens.cache;
                totalInputTokens += asNumber(tokens.input, 0);
                totalOutputTokens += asNumber(tokens.output, 0);
                totalCachedInputTokens += asNumber(cache?.read, 0);
            }
            totalCostUsd += asNumber(part.cost, 0);
        }
        catch {
            // not JSON or not a step_finish — ignore
        }
    }
    return await new Promise((resolve) => {
        const child = spawn(command, args, {
            cwd,
            env: resolvedEnv(env),
            stdio: ["ignore", "pipe", "pipe"],
        });
        let stdout = "";
        let stderr = "";
        let timedOut = false;
        let stdoutBuffer = "";
        const timeoutHandle = timeoutSec > 0
            ? setTimeout(() => {
                timedOut = true;
                child.kill("SIGTERM");
                setTimeout(() => child.kill("SIGKILL"), graceSec * 1000);
            }, timeoutSec * 1000)
            : null;
        child.stdout?.on("data", async (chunk) => {
            const text = chunk.toString("utf8");
            stdout += text;
            stdoutBuffer += text;
            // Parse complete lines to extract step_finish token/cost data.
            const lines = stdoutBuffer.split("\n");
            stdoutBuffer = lines.pop() ?? "";
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed)
                    parseStepFinishTokens(trimmed);
            }
            await ctx.onLog("stdout", text);
        });
        child.stderr?.on("data", async (chunk) => {
            const text = chunk.toString("utf8");
            stderr += text;
            await ctx.onLog("stderr", text);
        });
        child.on("error", async (err) => {
            if (timeoutHandle)
                clearTimeout(timeoutHandle);
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
            if (timeoutHandle)
                clearTimeout(timeoutHandle);
            // Flush any remaining buffered line.
            if (stdoutBuffer.trim())
                parseStepFinishTokens(stdoutBuffer.trim());
            const hasUsage = totalInputTokens > 0 || totalOutputTokens > 0 || totalCachedInputTokens > 0;
            resolve({
                exitCode: code,
                signal: sig,
                timedOut,
                sessionDisplayId: null,
                sessionParams: null,
                provider: model.includes("/") ? model.split("/")[1] ?? "kilo" : "kilo",
                model: model || null,
                billingType: "credits",
                ...(hasUsage ? {
                    usage: {
                        inputTokens: totalInputTokens,
                        outputTokens: totalOutputTokens,
                        cachedInputTokens: totalCachedInputTokens,
                    },
                } : {}),
                ...(totalCostUsd > 0 ? { costUsd: totalCostUsd } : {}),
                summary: stdout.trim().slice(0, 500),
                resultJson: { stdout, stderr, command, args },
            });
        });
    });
}
