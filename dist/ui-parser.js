function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        return null;
    }
}
function asRecord(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value))
        return null;
    return value;
}
function asString(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
}
function asNumber(value, fallback = 0) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
/**
 * Parse a Kilo CLI stdout line into Paperclip transcript entries.
 *
 * This module is intentionally self-contained because Paperclip reads the
 * source text and evaluates it in the UI runtime. Avoid imports beyond the
 * shared type-only contract.
 */
export function parseKiloStdoutLine(line, ts) {
    const parsed = asRecord(safeJsonParse(line));
    if (!parsed) {
        return [{ kind: "stdout", ts, text: line }];
    }
    const type = asString(parsed.type);
    if (type === "assistant" || type === "text") {
        const text = asString(parsed.text ?? parsed.content).trim();
        if (!text)
            return [];
        return [{ kind: "assistant", ts, text }];
    }
    if (type === "thinking" || type === "reasoning") {
        const text = asString(parsed.text ?? parsed.content).trim();
        if (!text)
            return [];
        return [{ kind: "thinking", ts, text }];
    }
    if (type === "tool_call") {
        const toolUseId = asString(parsed.toolUseId) || asString(parsed.id);
        return [
            {
                kind: "tool_call",
                ts,
                name: asString(parsed.name, "tool"),
                input: parsed.input ?? {},
                ...(toolUseId ? { toolUseId } : {}),
            },
        ];
    }
    if (type === "tool_result") {
        return [
            {
                kind: "tool_result",
                ts,
                toolUseId: asString(parsed.toolUseId, asString(parsed.id, "tool")),
                content: asString(parsed.content, line),
                isError: Boolean(parsed.isError),
            },
        ];
    }
    if (type === "result") {
        return [
            {
                kind: "result",
                ts,
                text: asString(parsed.text, "Kilo run completed"),
                inputTokens: asNumber(parsed.inputTokens),
                outputTokens: asNumber(parsed.outputTokens),
                cachedTokens: asNumber(parsed.cachedTokens),
                costUsd: asNumber(parsed.costUsd),
                subtype: asString(parsed.subtype, "result"),
                isError: Boolean(parsed.isError),
                errors: Array.isArray(parsed.errors) ? parsed.errors.filter((v) => typeof v === "string") : [],
            },
        ];
    }
    if (type === "error") {
        const text = asString(parsed.message, line);
        return [{ kind: "stderr", ts, text }];
    }
    return [{ kind: "stdout", ts, text: line }];
}
