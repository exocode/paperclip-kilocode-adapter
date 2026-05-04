# Paperclip KiloCode Adapter

External Paperclip adapter plugin for the current Kilo Code CLI.

Repository: https://github.com/exocode/paperclip-kilocode-adapter

## What this is

This package lets Paperclip run Kilo Code as a first-class external adapter plugin instead of hardcoding Kilo support into Paperclip core.

It targets the current Kilo Code CLI 1.0+ workflow documented in May 2026:
- install: `npm install -g @kilocode/cli`
- start: `kilo`
- non-interactive runs: `kilo run --auto "..."`
- update: `kilo upgrade`
- interactive provider setup: `/connect`
- config location: `~/.config/kilo/`

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

## Install

Local development against the Paperclip monorepo:

```bash
pnpm install
pnpm build
```

If you install this package into Paperclip as an external plugin, the package must be published or linked and expose built `dist/` files.

## Kilo CLI usage notes

Paperclip drives Kilo in autonomous mode with a prompt assembled from the current issue/task context.

The adapter intentionally uses the current Kilo 1.0 CLI shape:
- `kilo`
- `kilo run`
- `kilo --continue`
- `kilo upgrade`

Kilo config is expected under:
- `~/.config/kilo/opencode.json`
- `~/.config/kilo/opencode.jsonc`
- `~/.config/kilo/kilo.jsonc`
- `~/.config/kilo/config.json`

## Notes

- Code comments are in English to help future maintainers.
- The implementation is intentionally conservative and only depends on the stable CLI contract documented by Kilo Code as of May 2026.
- If Kilo changes its CLI again, update `src/server/execute.ts` and the README together.

## License

MIT
