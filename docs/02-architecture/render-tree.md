---
title: Render Tree
version: 0.1.0
status: Draft
owner: Engineering
last_updated: 2026-07-02
---

# Render Tree

## Overview

The Render Tree is the canonical rendering representation of a document.

It is produced by the Document Engine after all document processing has completed.

Every exporter consumes the Render Tree.

Exporters must never read:

- Markdown
- Markdown AST
- Semantic Document Model

The Render Tree is the final representation before serialization.

---

# Purpose

The Render Tree exists to separate document processing from document serialization.

```
Markdown

↓

Parser

↓

Semantic Model

↓

Theme Engine

↓

Transformers

↓

Layout Engine

↓

Render Tree

↓

Exporter

↓

DOCX / PDF / HTML / ODT / EPUB
```

---

# Goals

The Render Tree should be:

- Immutable
- Deterministic
- Serializable
- Exporter Agnostic
- Easy to Traverse
- Easy to Test
- Versioned

---

# Principles

The Render Tree contains:

- Resolved styles
- Final layout
- Final dimensions
- Final positions

The Render Tree does not contain:

- Markdown
- Theme definitions
- Layout algorithms
- Template logic

Everything has already been resolved.

---

# Document Structure

```
Document

├── Metadata

├── Pages

│   ├── Header

│   ├── Body

│   └── Footer

└── Assets
```

---

# Render Node Hierarchy

```
Document

├── Page

│   ├── Header

│   ├── Paragraph

│   ├── Heading

│   ├── Table

│   ├── Image

│   ├── List

│   ├── Code Block

│   └── Footer
```

---

# Base Render Node

Every render node shares common properties.

```typescript
interface RenderNode {

    id: string;

    type: string;

    bounds: Bounds;

    style: ResolvedStyle;

    children: RenderNode[];
}
```

---

# Bounds

Every node occupies space.

```typescript
interface Bounds {

    x: number;

    y: number;

    width: number;

    height: number;
}
```

Bounds are calculated by the Layout Engine.

---

# Resolved Style

Every node contains fully resolved styling.

Example

```typescript
interface ResolvedStyle {

    fontFamily: string;

    fontSize: number;

    fontWeight: number;

    color: string;

    background: string;

    alignment: string;

    spacing: Spacing;

}
```

No inheritance exists inside the Render Tree.

Everything is already resolved.

---

# Document Node

Represents the entire rendered document.

Properties

- metadata
- pages
- assets

---

# Page Node

Represents one page.

Properties

- width
- height
- margin
- header
- body
- footer

---

# Heading Node

Properties

- level
- runs

---

# Paragraph Node

Properties

- runs
- spacing
- alignment

---

# Text Run

Represents a continuous piece of text.

Properties

- text
- style

Example

```
Hello

Bold

Italic

Link
```

becomes

```
Paragraph

├── Run

├── Run

├── Run

└── Run
```

---

# Image Node

Properties

- source
- width
- height
- caption
- alignment

---

# Table Node

Contains

- Rows
- Columns
- Cells

Each cell contains child render nodes.

---

# List Node

Supports

- Ordered
- Unordered
- Nested

Each item contains child nodes.

---

# Code Block Node

Properties

- language
- lines
- style

Syntax highlighting has already been resolved.

---

# Header

Contains render nodes.

Headers should not contain layout logic.

---

# Footer

Contains render nodes.

Footers should not contain layout logic.

---

# Assets

Shared document assets.

Examples

- Images
- Fonts
- Icons

Exporters may reuse assets instead of duplicating them.

---

# Render Tree Example

```
Document

├── Page

│   ├── Header

│   ├── Heading

│   ├── Paragraph

│   ├── Image

│   ├── Table

│   └── Footer

├── Page

│   ├── Heading

│   ├── Paragraph

│   └── Code Block
```

---

# Export Contract

Every exporter receives exactly one object.

```typescript
export interface Exporter {

    export(document: RenderDocument): Promise<ArrayBuffer>;

}
```

The exporter does not know:

- Markdown
- Themes
- Templates
- Layout Engine

It only serializes.

---

# Render Tree Lifecycle

```
Semantic Document

↓

Theme Applied

↓

Template Applied

↓

Layout Calculated

↓

Render Tree Built

↓

Exporter
```

---

# Validation

The Render Tree validator checks:

- Duplicate IDs
- Invalid bounds
- Missing styles
- Empty pages
- Invalid hierarchy
- Invalid assets

---

# Versioning

The Render Tree has its own version.

```
Render Tree v1

↓

Exporter

↓

DOCX
```

Breaking changes require version upgrades.

---

# Future Nodes

Possible future render nodes:

- Equation
- Diagram
- Chart
- QR Code
- Watermark
- Annotation
- Sticky Note
- Callout
- Timeline
- Sidebar

Existing exporters should ignore unsupported nodes gracefully.

---

# Design Principles

The Render Tree is:

- Complete
- Self-contained
- Immutable
- Independent
- Deterministic

It represents the exact document that exporters should serialize.

---

# Ownership

Produced by:

- Document Engine

Consumed by:

- DOCX Exporter
- PDF Exporter
- HTML Exporter
- EPUB Exporter
- ODT Exporter

---

# Version History

| Version | Date | Notes |
|----------|------|-------|
| 0.1.0 | 2026-07-02 | Initial Render Tree specification |