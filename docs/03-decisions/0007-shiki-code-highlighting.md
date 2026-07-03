# ADR 0007: Shiki highlights code blocks at layout time

## Status

Accepted

## Context

`BUILD_PROMPT.md` Phase 1 requires code blocks with Shiki syntax highlighting
through the rendering pipeline. The Render Tree spec states that highlighting
is already resolved before export (`docs/02-architecture/render-tree.md`).

The live preview, DOCX exporter, and PDF exporter all consume the same
`RenderCodeBlock` nodes. Highlighting must therefore happen in the layout engine,
not in the web UI alone.

## Decision

- Add `@seamdoc/highlighter`, a Shiki wrapper with a fine-grained language and
  theme bundle and the JavaScript regex engine (no Oniguruma WASM) for browser
  and Node compatibility.
- During layout, fenced code blocks become `RenderCodeBlock.lines` as arrays of
  `TextRun` segments with per-token colors.
- Use the `github-light` Shiki theme for all built-in Seamdoc themes until
  per-theme Shiki mappings are defined. Token colors override the theme's base
  `code.color`; font family and size still come from the active theme.
- Call `initHighlighter()` once at web startup and in Vitest setup so
  `layoutDocument` can highlight synchronously after initialization.
- Unknown languages and unloadable grammars fall back to single-color plaintext.

## Consequences

- Preview, DOCX, and PDF show consistent syntax colors for supported languages.
- Golden DOCX snapshots include colored token runs in code blocks.
- Bundle size grows with bundled grammars; additional languages require explicit
  imports in `@seamdoc/highlighter`.
- Monaco editor highlighting remains independent; only the document preview and
  exports use Shiki.
