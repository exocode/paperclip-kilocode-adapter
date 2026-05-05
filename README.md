# Paperclip KiloCode Adapter

External Paperclip adapter plugin for the current Kilo Code CLI.

**📦 Available on JSR:** [jsr.io/@exocode/paperclip-kilocode-adapter](https://jsr.io/@exocode/paperclip-kilocode-adapter)

Repository: https://github.com/exocode/paperclip-kilocode-adapter

## What this is

This package lets Paperclip run Kilo Code as a first-class external adapter plugin instead of hardcoding Kilo support into Paperclip core.

It targets the current Kilo Code CLI workflow documented in May 2026:
- install: `npm install -g @kilocode/cli`
- start: `kilo`
- non-interactive runs: `kilo run --auto "..."`
- update: `kilo upgrade`
- interactive provider setup: `/connect`
- config location: `~/.config/kilo/`

## Important compatibility note

Paperclip decides whether an adapter should render the local configuration UI from the adapter capabilities it exposes.

This adapter now explicitly opts into the local adapter UI contract so that Paperclip renders:
- the shared local model picker
- the shared local thinking-effort picker
- the adapter-specific Kilo fields

If you install an older version of this package, the model dropdown may be missing even though `/adapters/kilocode_local/models` already returns models.

Use version `0.2.1` or later.

## Paperclip contract

This adapter exports the host-facing Paperclip plugin entrypoints expected by the external adapter loader:
- `createServerAdapter()`
- `./ui-parser`

The adapter type is:
- `kilocode_local`

## Project layout

- `src/index.ts` — shared metadata and Paperclip export surface
- `src/server/module.ts` — `createServerAdapter()`
- `src/server/execute.ts` — launches Kilo in autonomous mode
- `src/server/test.ts` — lightweight environment checks
- `src/server/session-codec.ts` — session persistence codec
- `src/server/config-schema.ts` — declarative config schema for Paperclip UI
- `src/server/detect-model.ts` — best-effort model detection from Kilo config files
- `src/ui-parser.ts` — self-contained stdout transcript parser for Paperclip UI

## Install for Paperclip users

### 1) Install and connect Kilo Code

```bash
npm install -g @kilocode/cli
kilo
```

Inside Kilo, finish provider setup with `/connect` if needed.

### 2) Install the Paperclip adapter plugin

From JSR (recommended):

```bash
npx jsr add @exocode/paperclip-kilocode-adapter
```

Or with deno:

```bash
deno add @exocode/paperclip-kilocode-adapter
```

Or with pnpm:

```bash
pnpm dlx jsr add @exocode/paperclip-kilocode-adapter
```

Then register it in Paperclip:

```bash
npx paperclipai adapter install @exocode/paperclip-kilocode-adapter
```

If you are developing locally from a checkout:

```bash
pnpm install
pnpm build
npx paperclipai adapter install /absolute/path/to/paperclip-kilocode-adapter
```

### 3) Select it in Paperclip

In the Paperclip agent configuration UI:
- choose adapter type `Kilocode (local)`
- choose a model in the shared `Model` dropdown
- optionally set a specific `Kilo model` override

## Local development

```bash
pnpm install
pnpm typecheck
pnpm build
```

If `pnpm` on your machine points at an old `PNPM_HOME`, fix it temporarily before running commands:

```bash
export PNPM_HOME="$HOME/Library/pnpm"
export PATH="$PNPM_HOME:$PATH"
```

## Kilo CLI usage notes

Paperclip drives Kilo in autonomous mode with a prompt assembled from the current issue/task context.

The adapter intentionally uses the current Kilo CLI shape:
- `kilo`
- `kilo run --auto --model <provider/model> "..."`
- `kilo --continue`
- `kilo upgrade`

Recommended first model:
- `kilo/kilo-auto/balanced`

You can list available models with:

```bash
kilo models
```

Useful adapter config example:

```json
{
  "command": "kilo",
  "model": "kilo/kilo-auto/balanced",
  "cwd": "/absolute/path/to/workspace",
  "timeoutSec": 1800,
  "graceSec": 30,
  "promptTemplate": "{{prompt}}"
}
```

Kilo config is expected under:
- `~/.config/kilo/opencode.json`
- `~/.config/kilo/opencode.jsonc`
- `~/.config/kilo/kilo.jsonc`
- `~/.config/kilo/config.json`

## Publishing to JSR

This repository includes `.github/workflows/publish.yml` for automated JSR publishing via GitHub Actions.

The workflow:
- runs on tags matching `v*` or via manual workflow dispatch
- requests `id-token: write` for OIDC authentication
- runs `pnpm install`, `pnpm typecheck`
- publishes with `npx jsr publish`

### JSR Authentication

JSR uses GitHub OIDC for authentication in CI/CD environments. The workflow automatically authenticates using the repository's GitHub identity.

For manual publishing from your local machine, JSR will prompt you to authorize via your browser the first time you run `jsr publish`.

### Release flow

1. Bump `version` in both `package.json` and `jsr.json`.
2. Commit to `main`.
3. Create and push a Git tag:

```bash
git tag v0.2.2
git push origin main --tags
```

4. GitHub Actions publishes the package to JSR automatically.

### Manual publishing

You can also publish manually:

```bash
npm install -g jsr
jsr publish
```

## Notes

- Code comments are in English to help future maintainers.
- The implementation is intentionally conservative and only depends on the stable CLI contract documented by Kilo Code as of May 2026.
- If Kilo changes its CLI again, update `src/server/execute.ts` and the README together.

## License

MIT
