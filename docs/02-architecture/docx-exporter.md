---
title: DOCX Exporter
version: 0.1.0
status: Draft
owner: Engineering
last_updated: 2026-07-02
---

# DOCX Exporter

## Overview

The DOCX Exporter is responsible for converting a Render Tree into a standards-compliant Microsoft Word (.docx) document.

The exporter is completely independent of:

- Markdown
- AST
- Semantic Document Model
- Theme Engine
- Layout Engine
- User Interface

Its only responsibility is serialization.

---

# Goals

The DOCX Exporter should be:

- Standards Compliant
- Deterministic
- Extensible
- High Performance
- Browser Compatible
- Testable

---

# Responsibilities

The exporter is responsible for:

- Creating Word document structure
- Mapping render nodes to Word elements
- Embedding assets
- Writing metadata
- Generating styles
- Packaging the final DOCX archive

The exporter must never:

- Parse Markdown
- Apply themes
- Calculate layout
- Modify document content

---

# Input

The exporter receives:

- Render Tree
- Export Settings

Example

```
Render Tree

+

Export Settings
```

---

# Output

```
Document.docx
```

Returned as:

```
ArrayBuffer
```

or

```
Blob
```

depending on the execution environment.

---

# Export Pipeline

```
Render Tree

↓

Validation

↓

Style Generation

↓

Asset Collection

↓

Word Object Model

↓

DOCX Package

↓

ZIP Archive

↓

Download
```

---

# Internal Architecture

```
DOCX Exporter

├── Validator

├── Style Generator

├── Asset Manager

├── Metadata Builder

├── Node Serializer

├── Package Builder

└── ZIP Generator
```

Every component has a single responsibility.

---

# Validator

Before exporting, validate:

- Document Structure
- Render Tree Version
- Missing Assets
- Invalid Dimensions
- Invalid Styles

Export should stop only for unrecoverable errors.

---

# Style Generator

Converts resolved styles into Word styles.

Responsibilities:

- Paragraph Styles
- Character Styles
- Table Styles
- Numbering Styles
- Heading Styles

The same style should only be generated once.

---

# Asset Manager

Responsible for embedding:

- Images
- Fonts (Future)
- Icons
- Attachments (Future)

Assets should be deduplicated.

---

# Metadata Builder

Supported metadata:

- Title
- Author
- Subject
- Keywords
- Description
- Company
- Created Date
- Modified Date

---

# Node Serializer

Each render node has a serializer.

Example

```
Heading

↓

Heading Serializer

↓

Word Paragraph
```

```
Table

↓

Table Serializer

↓

Word Table
```

Supported serializers:

- Heading
- Paragraph
- Text Run
- Image
- Table
- List
- Quote
- Code Block
- Horizontal Rule

---

# Package Builder

Responsible for constructing the DOCX package.

Produces:

```
word/

docProps/

_rels/

[Content_Types].xml
```

The package builder should hide all OpenXML details from higher layers.

---

# ZIP Generator

The final stage compresses the package into a valid `.docx` archive.

Responsibilities:

- Package Compression
- Archive Validation
- Binary Output

---

# Mapping Strategy

Each Render Node maps to a Word construct.

| Render Node | Word Element |
|-------------|--------------|
| Document | Document |
| Page | Section |
| Heading | Paragraph |
| Paragraph | Paragraph |
| Text Run | Text |
| Image | Drawing |
| Table | Table |
| Quote | Paragraph |
| Code Block | Paragraph |
| List | Numbering |

The mapping should remain stable across versions.

---

# Style Resolution

The exporter receives fully resolved styles.

Example:

```
Paragraph

↓

Resolved Style

↓

Word Style
```

The exporter must never evaluate theme inheritance.

---

# Asset Embedding

Supported assets:

- PNG
- JPEG
- SVG (Future)
- GIF (Future)

Unsupported assets should generate warnings.

---

# Numbering

Supports:

- Ordered Lists
- Unordered Lists
- Nested Lists

Future:

- Multi-level numbering
- Outline numbering
- Legal numbering

---

# Tables

Supports:

- Header Rows
- Cell Alignment
- Borders
- Backgrounds
- Column Widths
- Row Spanning
- Column Spanning

Future enhancements should not require renderer changes.

---

# Images

Supports:

- Inline Images
- Alignment
- Captions
- Scaling
- Alt Text

Future:

- Floating Images
- Text Wrapping
- Anchored Images

---

# Hyperlinks

Supports:

- External URLs
- Internal Anchors (Future)
- Bookmarks (Future)

---

# Headers & Footers

Supports:

- Static Headers
- Static Footers
- Page Numbers

Future:

- Different First Page
- Odd / Even Pages
- Dynamic Fields

---

# Error Handling

Recoverable errors:

- Missing image
- Unsupported node
- Invalid metadata

Fatal errors:

- Corrupt Render Tree
- Invalid document root
- Package generation failure

---

# Performance Goals

Small document (<20 pages)

- <250 ms

Medium document (<100 pages)

- <1 second

Large document (>500 pages)

- <3 seconds

Performance should be benchmarked continuously.

---

# Browser Compatibility

The exporter should work entirely inside modern browsers.

Supported:

- Chrome
- Edge
- Firefox
- Safari

No server should be required.

---

# Testing

The exporter should include:

- Unit Tests
- Snapshot Tests
- Golden File Tests
- OpenXML Validation
- Word Compatibility Tests

Generated documents should be deterministic.

---

# Future Enhancements

Potential future capabilities:

- Digital Signatures
- Password Protection
- Document Encryption
- Tracked Changes
- Comments
- Custom Properties
- Embedded Fonts
- Macros (Optional)
- OpenXML Extensions

---

# Design Principles

The DOCX Exporter should:

- Never mutate the Render Tree.
- Never depend on the UI.
- Never depend on Markdown.
- Never contain layout logic.
- Never contain theme logic.

Its sole responsibility is producing a valid Microsoft Word document.

---

# Version History

| Version | Date | Notes |
|----------|------|-------|
| 0.1.0 | 2026-07-02 | Initial DOCX Exporter specification |