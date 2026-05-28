import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
function asString(value) {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
function parseObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value)
        ? value
        : {};
}
function readEnvHome(config) {
    const env = parseObject(config.env);
    return path.resolve(asString(env.HOME) ?? os.homedir());
}
export function resolveKiloSkillsHome(config) {
    return path.join(readEnvHome(config), ".kilo", "skills");
}
function normalizeRuntimeSkills(value) {
    if (!Array.isArray(value))
        return [];
    const out = [];
    for (const raw of value) {
        const entry = parseObject(raw);
        const key = asString(entry.key) ?? asString(entry.name);
        const runtimeName = asString(entry.runtimeName) ?? asString(entry.name);
        const source = asString(entry.source);
        if (!key || !runtimeName || !source)
            continue;
        out.push({
            key,
            runtimeName,
            source: path.resolve(source),
            required: entry.required === true,
            requiredReason: asString(entry.requiredReason),
        });
    }
    return out;
}
function readSkillSyncPreference(config) {
    const raw = parseObject(config.paperclipSkillSync);
    const desiredValues = raw.desiredSkills;
    const desiredSkills = Array.isArray(desiredValues)
        ? desiredValues
            .filter((value) => typeof value === "string")
            .map((value) => value.trim())
            .filter(Boolean)
        : [];
    return {
        explicit: Object.prototype.hasOwnProperty.call(raw, "desiredSkills"),
        desiredSkills: Array.from(new Set(desiredSkills)),
    };
}
function canonicalizeDesiredSkillReference(reference, availableEntries) {
    const normalized = reference.trim().toLowerCase();
    if (!normalized)
        return "";
    const exactKey = availableEntries.find((entry) => entry.key.trim().toLowerCase() === normalized);
    if (exactKey)
        return exactKey.key;
    const runtimeMatches = availableEntries.filter((entry) => typeof entry.runtimeName === "string" && entry.runtimeName.trim().toLowerCase() === normalized);
    if (runtimeMatches.length === 1)
        return runtimeMatches[0]?.key ?? normalized;
    const slugMatches = availableEntries.filter((entry) => entry.key.trim().toLowerCase().split("/").pop() === normalized);
    if (slugMatches.length === 1)
        return slugMatches[0]?.key ?? normalized;
    return normalized;
}
export function resolveKiloDesiredSkillNames(config, availableEntries) {
    const preference = readSkillSyncPreference(config);
    const requiredSkills = availableEntries
        .filter((entry) => entry.required)
        .map((entry) => entry.key);
    if (!preference.explicit)
        return Array.from(new Set(requiredSkills));
    const desiredSkills = preference.desiredSkills
        .map((reference) => canonicalizeDesiredSkillReference(reference, availableEntries))
        .filter(Boolean);
    return Array.from(new Set([...requiredSkills, ...desiredSkills]));
}
function resolveInstalledEntryTarget(skillsHome, name, entry, linkedPath) {
    const targetPath = linkedPath
        ? path.resolve(skillsHome, linkedPath)
        : path.join(skillsHome, name);
    return {
        name,
        targetPath,
        managed: entry.isSymbolicLink(),
    };
}
async function readInstalledSkillTargets(skillsHome) {
    const entries = await fs.readdir(skillsHome, { withFileTypes: true }).catch(() => []);
    const out = new Map();
    for (const entry of entries) {
        const fullPath = path.join(skillsHome, entry.name);
        const linkedPath = entry.isSymbolicLink() ? await fs.readlink(fullPath).catch(() => null) : null;
        out.set(entry.name, resolveInstalledEntryTarget(skillsHome, entry.name, entry, linkedPath));
    }
    return out;
}
async function ensurePaperclipSkillSymlink(source, target) {
    const existing = await fs.lstat(target).catch(() => null);
    if (!existing) {
        await fs.symlink(source, target);
        return "created";
    }
    if (!existing.isSymbolicLink())
        return "skipped";
    const linkedPath = await fs.readlink(target).catch(() => null);
    if (!linkedPath)
        return "skipped";
    const resolvedLinkedPath = path.resolve(path.dirname(target), linkedPath);
    if (resolvedLinkedPath === path.resolve(source))
        return "skipped";
    await fs.unlink(target);
    await fs.symlink(source, target);
    return "repaired";
}
function originFor(entry) {
    if (entry.required) {
        return {
            origin: "paperclip_required",
            originLabel: "Paperclip required",
            readOnly: true,
        };
    }
    return {
        origin: "company_managed",
        originLabel: "Company skill",
        readOnly: false,
    };
}
async function buildKiloSkillSnapshot(config) {
    const availableEntries = normalizeRuntimeSkills(config.paperclipRuntimeSkills);
    const desiredSkills = resolveKiloDesiredSkillNames(config, availableEntries);
    const desiredSet = new Set(desiredSkills);
    const skillsHome = resolveKiloSkillsHome(config);
    const installed = await readInstalledSkillTargets(skillsHome);
    const availableByKey = new Map(availableEntries.map((entry) => [entry.key, entry]));
    const entries = [];
    const warnings = [];
    for (const available of availableEntries) {
        const installedEntry = installed.get(available.runtimeName) ?? null;
        const desired = desiredSet.has(available.key);
        const targetPath = path.join(skillsHome, available.runtimeName);
        let managed = false;
        let state = "available";
        let detail = null;
        if (installedEntry?.targetPath === available.source) {
            managed = true;
            state = desired ? "installed" : "stale";
            detail = "Installed in the Kilo global skills home.";
        }
        else if (installedEntry) {
            state = "external";
            detail = desired
                ? "Skill name is occupied by an external installation in the Kilo skills home."
                : "Installed outside Paperclip management in the Kilo skills home.";
        }
        else if (desired) {
            state = "missing";
            detail = "Configured but not currently linked into the Kilo global skills home.";
        }
        entries.push({
            key: available.key,
            runtimeName: available.runtimeName,
            desired,
            managed,
            required: available.required,
            requiredReason: available.requiredReason,
            state,
            sourcePath: available.source,
            targetPath,
            detail,
            locationLabel: "~/.kilo/skills",
            ...originFor(available),
        });
    }
    for (const desiredSkill of desiredSkills) {
        if (availableByKey.has(desiredSkill))
            continue;
        warnings.push(`Desired skill "${desiredSkill}" is not available from Paperclip runtime skills.`);
        entries.push({
            key: desiredSkill,
            runtimeName: null,
            desired: true,
            managed: true,
            state: "missing",
            origin: "external_unknown",
            originLabel: "External or unavailable",
            readOnly: false,
            sourcePath: null,
            targetPath: null,
            detail: "Paperclip cannot find this skill in the local runtime skills directory.",
        });
    }
    for (const [name, installedEntry] of installed.entries()) {
        if (availableEntries.some((entry) => entry.runtimeName === name))
            continue;
        entries.push({
            key: name,
            runtimeName: name,
            desired: false,
            managed: false,
            state: "external",
            origin: "user_installed",
            originLabel: "User-installed",
            locationLabel: "~/.kilo/skills",
            readOnly: true,
            sourcePath: null,
            targetPath: installedEntry.targetPath ?? path.join(skillsHome, name),
            detail: "Installed outside Paperclip management in the Kilo skills home.",
        });
    }
    entries.sort((left, right) => left.key.localeCompare(right.key));
    return {
        adapterType: "kilocode_local",
        supported: true,
        mode: "persistent",
        desiredSkills,
        entries,
        warnings,
    };
}
export async function listKiloSkills(ctx) {
    return buildKiloSkillSnapshot(ctx.config);
}
export async function syncKiloSkills(ctx, desiredSkills) {
    const availableEntries = normalizeRuntimeSkills(ctx.config.paperclipRuntimeSkills);
    const desiredSet = new Set([
        ...desiredSkills.map((reference) => canonicalizeDesiredSkillReference(reference, availableEntries)),
        ...availableEntries.filter((entry) => entry.required).map((entry) => entry.key),
    ].filter(Boolean));
    const skillsHome = resolveKiloSkillsHome(ctx.config);
    await fs.mkdir(skillsHome, { recursive: true });
    const installed = await readInstalledSkillTargets(skillsHome);
    const availableByRuntimeName = new Map(availableEntries.map((entry) => [entry.runtimeName, entry]));
    for (const available of availableEntries) {
        if (!desiredSet.has(available.key))
            continue;
        await ensurePaperclipSkillSymlink(available.source, path.join(skillsHome, available.runtimeName));
    }
    for (const [name, installedEntry] of installed.entries()) {
        const available = availableByRuntimeName.get(name);
        if (!available)
            continue;
        if (desiredSet.has(available.key))
            continue;
        if (installedEntry.targetPath !== available.source)
            continue;
        await fs.unlink(path.join(skillsHome, name)).catch(() => { });
    }
    return buildKiloSkillSnapshot(ctx.config);
}
export async function ensureKiloSkillsInjected(config, onLog) {
    const availableEntries = normalizeRuntimeSkills(config.paperclipRuntimeSkills);
    const desiredSkillNames = new Set(resolveKiloDesiredSkillNames(config, availableEntries));
    const selectedEntries = availableEntries.filter((entry) => desiredSkillNames.has(entry.key));
    if (selectedEntries.length === 0)
        return;
    const skillsHome = resolveKiloSkillsHome(config);
    try {
        await fs.mkdir(skillsHome, { recursive: true });
    }
    catch (err) {
        await onLog("stderr", `[paperclip] Failed to prepare Kilo skills directory ${skillsHome}: ${err instanceof Error ? err.message : String(err)}\n`);
        return;
    }
    for (const entry of selectedEntries) {
        try {
            const result = await ensurePaperclipSkillSymlink(entry.source, path.join(skillsHome, entry.runtimeName));
            if (result === "skipped")
                continue;
            await onLog("stderr", `[paperclip] ${result === "repaired" ? "Repaired" : "Linked"} Kilo skill "${entry.key}" into ${skillsHome}\n`);
        }
        catch (err) {
            await onLog("stderr", `[paperclip] Failed to inject Kilo skill "${entry.key}" into ${skillsHome}: ${err instanceof Error ? err.message : String(err)}\n`);
        }
    }
}
