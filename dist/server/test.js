function summarizeStatus(checks) {
    if (checks.some((check) => check.level === "error"))
        return "fail";
    if (checks.some((check) => check.level === "warn"))
        return "warn";
    return "pass";
}
export async function testEnvironment(ctx) {
    const checks = [];
    const command = typeof ctx.config.command === "string" && ctx.config.command.trim().length > 0 ? ctx.config.command.trim() : "kilo";
    checks.push({
        code: "kilocode_cli_assumed",
        level: "info",
        message: `Kilo CLI command configured as: ${command}`,
    });
    checks.push({
        code: "kilocode_cli_version_policy",
        level: "info",
        message: "This adapter targets Kilo Code CLI 7.x — uses kilo run --auto for autonomous runs.",
    });
    const model = typeof ctx.config.model === "string" ? ctx.config.model.trim() : "";
    if (!model) {
        checks.push({
            code: "kilocode_model_missing",
            level: "warn",
            message: "No Kilo model configured; Kilo will fall back to its local/default model selection.",
            hint: "Choose a model such as kilo/kilo-auto/balanced or kilo/openai/gpt-5.5 in the Paperclip agent config.",
        });
    }
    else if (!model.includes("/")) {
        checks.push({
            code: "kilocode_model_format",
            level: "warn",
            message: `Kilo model should usually use provider/model format: ${model}`,
            hint: "Run `kilo models` and select one of the returned IDs.",
        });
    }
    if (typeof ctx.config.cwd === "string" && ctx.config.cwd.trim().length > 0 && !ctx.config.cwd.trim().startsWith("/")) {
        checks.push({
            code: "kilocode_cwd_not_absolute",
            level: "warn",
            message: `Working directory should usually be absolute: ${ctx.config.cwd.trim()}`,
        });
    }
    if (typeof ctx.config.configDir === "string" && ctx.config.configDir.trim().length > 0 && !ctx.config.configDir.trim().startsWith("/")) {
        checks.push({
            code: "kilocode_config_dir_not_absolute",
            level: "warn",
            message: `Config directory should usually be absolute: ${ctx.config.configDir.trim()}`,
        });
    }
    return {
        adapterType: ctx.adapterType,
        status: summarizeStatus(checks),
        checks,
        testedAt: new Date().toISOString(),
    };
}
