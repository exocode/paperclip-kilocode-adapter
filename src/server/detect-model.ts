import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function findFirstExisting(paths: string[]): string | null {
  for (const candidate of paths) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function readJsonIfExists(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export async function detectModel(): Promise<{ model: string; provider: string; source: string; candidates?: string[] } | null> {
  const configDir = findFirstExisting([
    process.env.KILO_CONFIG_DIR ?? "",
    path.join(os.homedir(), ".config", "kilo"),
    path.join(os.homedir(), ".config", "kilo", "opencode.json"),
  ].filter(Boolean));

  const configFile = configDir && fs.statSync(configDir).isDirectory()
    ? findFirstExisting([
        path.join(configDir, "opencode.json"),
        path.join(configDir, "opencode.jsonc"),
        path.join(configDir, "kilo.jsonc"),
        path.join(configDir, "config.json"),
      ])
    : configDir;

  if (!configFile) return null;

  const parsed = readJsonIfExists(configFile);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  const record = parsed as Record<string, unknown>;
  const model = readNonEmptyString(record.model);
  const provider = readNonEmptyString(record.provider)
    ?? (model?.includes("/") ? model.split("/")[0] ?? null : null)
    ?? "kilo";
  if (!model) return null;

  const candidates = Array.isArray(record.enabled_providers)
    ? record.enabled_providers.filter((v): v is string => typeof v === "string")
    : undefined;

  return {
    model,
    provider,
    source: configFile,
    ...(candidates && candidates.length > 0 ? { candidates } : {}),
  };
}
