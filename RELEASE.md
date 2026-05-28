# Release checklist

## Current release target

- package: `@exocode/paperclip-kilocode-adapter`
- version: `0.2.7`
- git tag: `v0.2.7`

## Preflight

- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `npm pack --dry-run`
- [ ] confirm GitHub Actions workflow exists at `.github/workflows/publish.yml`
- [ ] confirm package version in `package.json`

## One-time npm trusted publisher setup

Log in with an npm account that owns the `@exocode` scope or package.

```bash
npm login
npm trust github @exocode/paperclip-kilocode-adapter \
  --repo exocode/paperclip-kilocode-adapter \
  --file publish.yml \
  --yes
```

Equivalent npm web UI values:
- owner: `exocode`
- repository: `paperclip-kilocode-adapter`
- workflow file: `publish.yml`

## Publish flow

```bash
git checkout main
git pull --ff-only
git tag v0.2.7
git push origin main --tags
```

## Expected automation

GitHub Actions workflow `Publish package` should:
- install dependencies with pnpm
- run typecheck
- build the package
- publish to npm with provenance

## Verification

After the workflow succeeds:

```bash
npm view @exocode/paperclip-kilocode-adapter version dist-tags --json
```

Expected result should include:
- version `0.2.7`
- dist-tag `latest: 0.2.7`

## Notes

- The package name currently returns `404 Not Found` on npm, which means it is not currently published.
- That does not guarantee the scope permissions are already set up; npm still requires an authenticated owner to create the trusted publisher relationship.
