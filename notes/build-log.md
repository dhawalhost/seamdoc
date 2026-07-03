# Seamdoc Build Log

One lesson per entry, newest first. Records corrections and confirmed approaches
that git history alone doesn't explain.

## Playwright: addInitScript wipes storage on in-test reloads

Clearing localStorage via `addInitScript` re-runs on every navigation and
breaks persistence tests. Clear once via `page.evaluate` + reload in
beforeEach instead.

## Feature-list conflict: theme import/export is P0 but roadmapped to v0.2

Resolved via ADR 0002 (roadmap wins as the more specific statement); v0.1 has
no theme import/export UI.

## Determinism: docx library randomizes relationship IDs

The `docx` npm package generates random `r:id` relationship identifiers, so
whole-file byte determinism is impossible without patching the library.
ADR 0001 (docs/03-decisions/) scopes the determinism guarantee to content;
tests normalize `r:id` before golden/determinism comparisons.

## Layout: pagination uses heuristic text measurement

Exact glyph metrics are unavailable outside a rendering surface. The layout
engine estimates heights with a fixed average-char-width model
(packages/renderer/src/measure.ts). DOCX reflows text natively, so estimates
only affect page grouping in the render tree, not visible output.

## exactOptionalPropertyTypes: build optional-field objects conditionally

The strict tsconfig flag rejects passing `{ foo: maybeUndefined }` to a type
with optional `foo`. Spread conditionals (`...(x ? { foo: x } : {})`) are the
pattern used across core and the DOCX exporter.

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
