# ADR 0004: Templates are applied at export, not in the layout pipeline

## Status

Accepted

## Context

`docs/02-architecture/template-engine.md` sketches the rendering order as
Semantic Document → Theme → Template → Layout → Render Tree, implying the
template participates before layout. But the render tree is defined as
format-neutral (`render-tree.md`): it carries fully resolved visual styles
and no knowledge of Word style identifiers. Injecting Word style ids into
the render tree would leak DOCX concepts into every consumer, including the
preview and the PDF exporter.

## Decision

- The template profile travels alongside the export request
  (`ExportSettings.template`, a format-neutral `ExportTemplate` shape in
  `@seamdoc/types`: raw `styles.xml` plus a semantic-node → style-id
  mapping).
- The DOCX exporter honors it: the template's `styles.xml` is embedded via
  the `docx` library's `externalStyles`, mapped blocks emit `w:pStyle`
  references, and direct font/size/color formatting is omitted on mapped
  paragraphs so the template's typography wins (bold/italic/underline are
  kept as semantic emphasis).
- The template's page setup (size, orientation, margins) is applied to the
  document settings when the template is activated, so the preview and all
  exporters see it — this part does flow through layout.
- Exporters with no native style concept (PDF) ignore the mapping.

## Consequences

- The render tree stays exporter-agnostic and the template engine stays
  independent of exporters (its own design principle), at the cost of the
  preview not simulating template typography.
- Table style mapping is limited to a table style reference; per-cell
  template formatting is not reproduced.
- Numbering definitions, headers/footers, and embedded assets from the
  template are detected but not yet re-emitted; they are recorded on the
  profile (`hasHeader`/`hasFooter`) for a later milestone.
