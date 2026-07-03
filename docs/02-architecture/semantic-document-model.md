---
title: Semantic Document Model
version: 0.1.0
status: Draft
owner: Engineering
last_updated: 2026-07-02
---

# Semantic Document Model

## Overview

The Semantic Document Model (SDM) is the canonical representation of every document inside Seamdoc.

Every supported input format is converted into the SDM.

Every renderer, exporter, theme, template, plugin, and layout engine consumes the SDM.

This makes Seamdoc independent of both input formats and output formats.

---

# Goals

The Semantic Document Model should be:

- Input Agnostic
- Output Agnostic
- Extensible
- Serializable
- Testable
- Deterministic
- Human Readable

---

# Why a Semantic Model?

Markdown is only one way to describe a document.

Future inputs may include:

- Markdown
- MDX
- HTML
- GitHub README
- Notion Export
- AI Generated Markdown
- AsciiDoc

Instead of writing renderers for every input format, each parser converts its input into the same semantic model.

```
Markdown ─────┐
HTML ─────────┤
MDX ──────────┤
Notion ───────┤
AsciiDoc ─────┤
GitHub ───────┤
               ▼
     Semantic Document Model
               ▼
DOCX / PDF / HTML / EPUB
```

---

# Root Structure

Every document begins with a root node.

```text
Document
```

The document contains metadata and child nodes.

Example:

```json
{
  "type": "document",
  "metadata": {},
  "children": []
}
```

---

# Node Principles

Every node must:

- Have a type
- Be immutable after creation
- Be serializable
- Be renderer independent
- Contain only semantic information

Nodes should never contain:

- Colors
- Fonts
- Sizes
- Margins
- Theme information
- Layout information

---

# Core Node Types

## Document

Represents the entire document.

Properties

- metadata
- children

---

## Heading

Represents a heading.

Properties

- level
- children

Example

```json
{
  "type": "heading",
  "level": 1,
  "children": []
}
```

---

## Paragraph

Represents a paragraph.

Properties

- children

---

## Text

Represents plain text.

Properties

- value

Example

```json
{
  "type": "text",
  "value": "Hello World"
}
```

---

## Emphasis

Represents italic text.

---

## Strong

Represents bold text.

---

## Inline Code

Represents inline code.

---

## Code Block

Represents a fenced code block.

Properties

- language
- value

Example

```json
{
  "type": "code",
  "language": "typescript",
  "value": "console.log('Hello');"
}
```

---

## Quote

Represents block quotes.

---

## Horizontal Rule

Represents thematic breaks.

---

## Link

Properties

- url
- title
- children

---

## Image

Properties

- src
- alt
- title

---

## List

Properties

- ordered
- items

---

## List Item

Represents a single list item.

---

## Table

Contains:

- Header
- Body
- Rows
- Cells

---

## Table Row

Represents one row.

---

## Table Cell

Represents one table cell.

---

## Line Break

Represents a forced line break.

---

# Metadata

Document metadata is stored separately.

Example

```json
{
  "title": "",
  "author": "",
  "description": "",
  "keywords": [],
  "language": "",
  "createdAt": "",
  "updatedAt": ""
}
```

---

# Future Nodes

Future versions may introduce:

- Footnote
- Citation
- Formula
- Diagram
- Callout
- Alert
- Timeline
- Tabs
- Mermaid
- PlantUML
- Task List
- Definition List

Adding new node types must never break existing renderers.

---

# Node Relationships

```
Document

├── Heading

├── Paragraph

│   ├── Text

│   ├── Strong

│   └── Link

├── Code

├── Table

├── Image

└── List
```

---

# Rendering Rules

Renderers should never inspect Markdown.

Renderers should only inspect semantic node types.

Example:

```
Heading

↓

Theme

↓

Heading Style

↓

Render
```

Not:

```
#

↓

Render
```

---

# Validation

Every Semantic Document must satisfy:

- Exactly one Document root.
- Valid node hierarchy.
- Valid metadata.
- No circular references.
- No orphan nodes.
- Valid property types.

---

# Serialization

The model must support JSON serialization.

Reasons:

- Debugging
- Testing
- Snapshots
- APIs
- Future cloud rendering

---

# Extensibility

Every new feature should introduce new node types rather than modifying existing ones.

Example

Instead of changing Image:

```
Image

↓

ResponsiveImage
```

This minimizes breaking changes.

---

# Versioning

The Semantic Document Model should be versioned independently from the Seamdoc application.

Future changes must support migration whenever possible.

Example

```
SDM v1

↓

Migration

↓

SDM v2
```

---

# Ownership

| Package | Responsibility |
|----------|----------------|
| parser | Create nodes |
| semantic-model | Validate nodes |
| renderer | Consume nodes |
| theme-engine | Style nodes |
| layout-engine | Position nodes |
| exporters | Serialize nodes |

---

# Design Principles

The Semantic Document Model is:

- The single source of truth.
- Independent of Markdown.
- Independent of Microsoft Word.
- Independent of HTML.
- Independent of PDF.
- Independent of any UI framework.

It represents only the meaning of the document.

---

# Version History

| Version | Date | Notes |
|----------|------|-------|
| 0.1.0 | 2026-07-02 | Initial Semantic Document Model |