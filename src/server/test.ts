import type { AdapterEnvironmentCheck, AdapterEnvironmentTestContext, AdapterEnvironmentTestResult } from "@paperclipai/adapter-utils";

function summarizeStatus(checks: AdapterEnvironmentCheck[]): AdapterEnvironmentTestResult["status"] {
  if (checks.some((check) => check.level === "error")) return "fail";
  if (checks.some((check) => check.level === "warn")) return "warn";
  return "pass";
}

export async function testEnvironment(ctx: AdapterEnvironmentTestContext): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const command = typeof ctx.config.command === "string" && ctx.config.command.trim().length > 0 ? ctx.config.command.trim() : "kilo";

  checks.push({
    code: "kilocode_cli_assumed",
    level: "info",
    message: `Kilo CLI command configured as: ${command}`,
  });

  checks.push({
    code: "kilocode_cli_version_policy",
    level: "info",
    message: "This adapter targets Kilo Code CLI 1.0+ with the current kilo run / connect / upgrade workflow.",
  });

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
