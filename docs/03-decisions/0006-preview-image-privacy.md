# ADR 0006: Preview and export share an image privacy policy

## Status

Accepted

## Context

The live preview renders the same Render Tree that exporters consume
(`apps/web/src/components/PreviewPane.tsx`). Before this decision, block-level
images used `<img src={url}>`, which caused the browser to fetch remote URLs
whenever Markdown referenced `http://` or `https://` images.

The privacy doctrine forbids network round-trips for document data. Export
already followed this rule: the DOCX exporter emits italic alt-text placeholders
and the PDF exporter draws bordered boxes (ADR 0003). Preview was the gap.

## Decision

- **Remote and relative URLs** (`http://`, `https://`, and path-only `src`
  values) render as bordered placeholders with alt text in preview, matching
  export semantics. No `<img>` element is created for these sources.
- **Embedded data URLs** (`data:image/…`) may render as pixels in preview
  because the bytes are already in the document; no network fetch occurs.
  Exporters will embed data URLs when local image support is implemented
  (ADR 0003 consequence).
- **Inline images** (image nodes inside paragraph runs) continue to degrade to
  italic alt text in the layout engine; preview never loads them as images.

Placeholder label format matches DOCX: `[image]` when alt is empty, otherwise
`[alt text]`.

## Consequences

- Preview no longer leaks document image URLs to the network.
- Preview and export show consistent placeholders for external images until
  asset embedding ships.
- Future local-image work only needs to extend `isEmbeddableImageSrc` and the
  exporters in one place per surface.
