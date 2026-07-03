# ADR 0003: PDF exporter uses standard fonts and image placeholders

## Status

Accepted

## Context

The v0.2 roadmap requires PDF export via the exporter SDK. Two spec-level
tensions surfaced during implementation:

1. **Fonts.** Themes reference arbitrary font families (Georgia, Consolas,
   Calibri, …). Embedding real font files in the browser would require either
   bundling font binaries with the app or fetching them from a network at
   export time. The privacy doctrine forbids network round-trips for document
   data, and bundling licensed fonts is not legally possible for several
   theme fonts.
2. **Images.** Markdown images reference external URLs. Fetching them at
   export time is a network round-trip for document content, which the
   privacy doctrine forbids.

## Decision

- The PDF exporter maps every theme font family onto the closest of the 14
  PDF standard fonts (Helvetica, Times Roman, Courier — with bold/italic
  variants), chosen by serif/sans/monospace classification of the family
  name. Text outside WinAnsi encoding is replaced with `?`.
- Images are rendered as bordered placeholder boxes containing the alt text,
  matching the DOCX exporter's current behaviour of not fetching remote
  content.

## Consequences

- PDF output is fully self-contained, deterministic, and produced without
  any network access.
- PDF typography approximates the theme rather than matching it exactly;
  DOCX remains the canonical high-fidelity output.
- When local image support lands (file-embedded or data-URL images), both
  exporters can embed real image data without violating the doctrine.
