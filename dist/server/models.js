import { spawn } from "node:child_process";
export const DEFAULT_KILOCODE_LOCAL_MODEL = "kilo/kilo-auto/balanced";
export const fallbackModels = [
    { id: "kilo/kilo-auto/balanced", label: "Kilo Auto Balanced" },
    { id: "kilo/kilo-auto/frontier", label: "Kilo Auto Frontier" },
    { id: "kilo/kilo-auto/small", label: "Kilo Auto Small" },
    { id: "kilo/openai/gpt-5.5", label: "OpenAI GPT-5.5" },
    { id: "kilo/openai/gpt-5.4", label: "OpenAI GPT-5.4" },
    { id: "kilo/openai/gpt-5.4-mini", label: "OpenAI GPT-5.4 Mini" },
    { id: "kilo/openai/gpt-5.3-codex", label: "OpenAI GPT-5.3 Codex" },
    { id: "kilo/anthropic/claude-opus-4.7", label: "Claude Opus 4.7" },
    { id: "kilo/anthropic/claude-opus-4.6", label: "Claude Opus 4.6" },
    { id: "kilo/anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
    { id: "kilo/google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview" },
];
function firstNonEmptyLine(text) {
    return text.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? "";
}
function labelFromModelId(id) {
    const parts = id.split("/");
    const provider = (parts.length >= 3 ? parts[1] : "kilo") ?? "kilo";
    const model = parts[parts.length - 1] ?? id;
    const readableProvider = provider
        .split(/[-_]/g)
        .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
        .join(" ");
    return `${readableProvider} ${model}`;
}
export function parseKiloModelsOutput(output) {
    const seen = new Set();
    const models = [];
    for (const rawLine of output.split(/\r?\n/)) {
        const id = rawLine.trim();
        if (!id || seen.has(id))
            continue;
        if (!id.includes("/"))
            continue;
        seen.add(id);
        models.push({ id, label: labelFromModelId(id) });
    }
    return models;
}
export async function listKiloModels(command = "kilo") {
    const result = await new Promise((resolve) => {
        const child = spawn(command, ["models"], { stdio: ["ignore", "pipe", "pipe"] });
        let stdout = "";
        let stderr = "";
        child.stdout?.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
        child.stderr?.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
        child.on("error", (err) => resolve({ exitCode: 1, stdout, stderr: err instanceof Error ? err.message : String(err) }));
        child.on("close", (code) => resolve({ exitCode: code, stdout, stderr }));
    });
    if ((result.exitCode ?? 1) !== 0) {
        const detail = firstNonEmptyLine(result.stderr) || firstNonEmptyLine(result.stdout);
        throw new Error(detail ? `kilo models failed: ${detail}` : "kilo models failed");
    }
    const models = parseKiloModelsOutput(result.stdout);
    return models.length > 0 ? models : fallbackModels;
}
