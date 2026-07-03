# Seamdoc Build Log

One lesson per entry, newest first. Records corrections and confirmed approaches
that git history alone doesn't explain.

## Toolchain: pnpm 9 pinned because host Node is 22.12

pnpm 10 requires Node >= 22.13 and corepack's bundled signature keys are stale
on this machine (signature verification error). Installed pnpm 9 via
`npm install -g pnpm@9 --force`. `packageManager` field pins `pnpm@9.15.9`.
If the host Node is upgraded past 22.13, pnpm 10 becomes an option.

## Workspace layout: exporters are nested workspace packages

`pnpm-workspace.yaml` includes `packages/exporters/*` as a separate glob so each
export format (docx, pdf, ...) is its own package per
`docs/02-architecture/folder-structure.md`.

## Bin resolution: root devDeps provide tsc/eslint/vitest to all packages

Packages don't declare their own devDependencies on the toolchain; pnpm puts
ancestor `node_modules/.bin` on PATH when running scripts, and Node module
resolution walks up to the root `node_modules` for ESLint config imports.
