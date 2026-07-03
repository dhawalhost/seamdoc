---
title: "ADR 0001: DOCX relationship IDs are excluded from determinism guarantees"
status: Accepted
date: 2026-07-03
---

# Context

The rendering pipeline must be deterministic: same Markdown, same theme, and
same settings must always produce the same document
(docs/00-overview/project-doctrine.md, principle 13; docs/02-architecture/rendering-pipeline.md).

The DOCX exporter is built on the `docx` npm library, which generates random
unique identifiers for OpenXML relationship IDs (`r:id` attributes linking
hyperlinks, headers, and footers to the package relationships part). Two
exports of the same input produce identical content but different relationship
ID strings.

# Decision

Relationship IDs are excluded from the determinism guarantee. They are
Word-internal wiring with no user-visible effect: the hyperlink targets,
text, and styling are identical across exports, and Word resolves the IDs
per-file.

Golden-file and determinism tests normalize `r:id` values before comparison
so that any real content or styling regression still fails the tests.

# Consequences

- Byte-identical `.docx` output across runs is not guaranteed; content-identical
  output is, and is enforced by tests.
- If full byte determinism becomes a requirement (e.g. for caching or signing),
  the exporter must patch or replace the `docx` library's ID generation with a
  seeded, deterministic counter. This is a contained change inside
  `packages/exporters/docx`.
