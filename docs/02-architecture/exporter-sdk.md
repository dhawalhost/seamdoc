---
title: Exporter SDK
version: 0.1.0
status: Draft
owner: Engineering
last_updated: 2026-07-02
---

# Exporter SDK

## Overview

The Exporter SDK defines the contract between the Document Engine and every supported output format.

The SDK enables new exporters to be developed independently without modifying the rendering pipeline.

The Document Engine knows nothing about DOCX, PDF, HTML, or any future output format.

Its only responsibility is to produce a Render Tree.

---

# Goals

The Exporter SDK should be:

- Format Independent
- Extensible
- Testable
- Stateless
- Replaceable
- Versioned

---

# Responsibilities

An exporter is responsible for:

- Receiving a Render Tree
- Converting it into an output format
- Returning the generated document

An exporter is **not** responsible for:

- Parsing Markdown
- Applying themes
- Applying templates
- Performing layout
- Running transformers

All processing is complete before an exporter begins.

---

# Pipeline

```
Markdown

↓

Parser

↓

Semantic Model

↓

Document Engine

↓

Render Tree

↓

Exporter SDK

↓

Exporter

↓

Generated File
```

---

# Export Lifecycle

```
Receive Render Tree

↓

Validate

↓

Prepare Resources

↓

Serialize

↓

Generate File

↓

Return Output
```

---

# Export Interface

```typescript
export interface Exporter {

    id: string;

    name: string;

    version: string;

    supports(format: ExportFormat): boolean;

    export(document: RenderDocument): Promise<ExportResult>;

}
```

---

# Export Result

```typescript
export interface ExportResult {

    filename: string;

    mimeType: string;

    data: ArrayBuffer;

}
```

---

# Export Formats

Initially supported:

- DOCX

Future exporters:

- PDF
- HTML
- EPUB
- ODT
- Markdown
- JSON
- Plain Text

---

# Export Context

Every exporter receives the same context.

```typescript
interface ExportContext {

    document: RenderDocument;

    metadata: DocumentMetadata;

    assets: AssetCollection;

    settings: ExportSettings;

}
```

This guarantees consistency across exporters.

---

# Export Settings

Common settings include:

- Page Size
- Orientation
- Compression
- Image Quality
- Metadata
- Output Filename

Each exporter may define additional settings.

---

# Asset Management

Assets are resolved before export.

Supported assets:

- Images
- Fonts
- Icons
- Embedded Files

Exporters should not fetch external resources during serialization.

---

# Validation

Before exporting, the SDK validates:

- Render Tree version
- Missing assets
- Invalid page dimensions
- Unsupported node types
- Export configuration

Validation failures should return descriptive errors.

---

# Unsupported Features

If an exporter does not support a node type:

- Log a warning.
- Fallback where possible.
- Continue export.

Exporters should fail gracefully.

---

# Version Compatibility

Each exporter declares supported versions.

Example:

```
Render Tree v1

↓

DOCX Exporter v1
```

Breaking changes require explicit compatibility updates.

---

# Built-in Exporters

Seamdoc ships with:

- DOCX Exporter

Planned exporters:

- PDF
- HTML
- EPUB
- ODT

Community exporters are encouraged.

---

# Community Exporters

Third-party developers may publish exporters.

Requirements:

- Implement the SDK.
- Declare compatibility.
- Include documentation.
- Include tests.

---

# Performance Goals

Typical document (<50 pages)

- Export in under 500 ms

Medium document (<200 pages)

- Export in under 2 seconds

Large document (>500 pages)

- Export in under 5 seconds

---

# Testing

Every exporter should include:

- Unit Tests
- Snapshot Tests
- Golden File Tests
- Compatibility Tests

Generated output should be deterministic.

---

# Error Handling

Possible failures include:

- Invalid Render Tree
- Missing Assets
- Unsupported Features
- Corrupt Output

Exporters should return structured errors.

---

# Future Enhancements

Potential future capabilities:

- Streaming Export
- Incremental Export
- Cloud Export
- Batch Export
- Parallel Export
- Digital Signatures
- Encryption
- Password Protection

These features should be implemented without modifying the core SDK.

---

# Design Principles

Exporters should:

- Be independent.
- Be deterministic.
- Be replaceable.
- Never modify the Render Tree.
- Never depend on the UI.

---

# Version History

| Version | Date | Notes |
|----------|------|-------|
| 0.1.0 | 2026-07-02 | Initial Exporter SDK |