---
title: Template Engine
version: 0.1.0
status: Draft
owner: Engineering
last_updated: 2026-07-02
---

# Template Engine

## Overview

The Template Engine enables users to apply existing Microsoft Word (.docx) templates to generated documents.

Unlike themes, which define presentation programmatically, templates preserve the structure and styling created directly in Microsoft Word.

The Template Engine bridges the gap between semantic documents and enterprise document standards.

---

# Vision

Organizations already have professionally designed Word templates.

Seamdoc should allow users to reuse those templates without recreating them manually.

The workflow should be:

```
Markdown

+

CompanyTemplate.docx

↓

Generate

↓

Professional Document
```

---

# Goals

The Template Engine should:

- Import existing DOCX templates
- Detect styles automatically
- Map styles to semantic nodes
- Preserve headers and footers
- Preserve numbering
- Preserve branding
- Reuse corporate formatting

---

# Non Goals

The Template Engine is **not** responsible for:

- Editing DOCX templates
- Acting as a Word editor
- Creating templates from scratch

Users should continue using Microsoft Word to design templates.

---

# Responsibilities

The Template Engine is responsible for:

- Loading templates
- Reading OpenXML
- Extracting styles
- Mapping styles
- Applying layouts
- Providing template profiles

---

# Pipeline

```
DOCX Template

↓

Import

↓

Analyze

↓

Extract Styles

↓

Map Styles

↓

Validate

↓

Template Profile

↓

Renderer
```

---

# Supported Inputs

Initially:

- .docx

Future:

- .dotx
- Organization Profiles
- Marketplace Templates

---

# Template Structure

A template consists of:

```
Template

├── Metadata

├── Styles

├── Theme

├── Numbering

├── Headers

├── Footers

├── Sections

├── Assets

└── Settings
```

---

# Metadata

Each imported template stores:

- Name
- Description
- Author
- Version
- Company
- Source
- Created Date

---

# Style Extraction

The importer should detect:

- Heading Styles
- Paragraph Styles
- Character Styles
- Table Styles
- List Styles
- Caption Styles
- Quote Styles
- Code Styles

No manual XML editing should be required.

---

# Style Mapping

The Template Engine maps semantic nodes to Word styles.

Example

| Semantic Node | Word Style |
|---------------|------------|
| Heading 1 | Heading 1 |
| Heading 2 | Corporate Heading |
| Paragraph | Normal |
| Quote | Quote |
| Code Block | Code |
| Table | Table Grid |

Mappings are configurable.

---

# Automatic Mapping

The engine should attempt automatic mapping.

Example:

```
Heading 1

↓

Heading 1
```

```
Normal

↓

Paragraph
```

```
Quote

↓

Quote
```

Unknown styles require user confirmation.

---

# Mapping Wizard

When automatic mapping fails, users are guided through a wizard.

Workflow:

```
Upload Template

↓

Detect Styles

↓

Suggest Mappings

↓

User Confirms

↓

Save Profile
```

---

# Template Profiles

Mappings are stored as reusable profiles.

Example:

```
Acme Corporate

↓

CompanyTemplate.docx

↓

Mappings

↓

Brand Assets

↓

Settings
```

Profiles eliminate repeated setup.

---

# Preserved Elements

The engine should preserve:

- Headers
- Footers
- Watermarks
- Logos
- Margins
- Page Size
- Orientation
- Section Breaks
- Numbering
- Cover Pages
- Document Properties

---

# Theme Interaction

Templates complement themes.

Rendering order:

```
Semantic Document

↓

Theme

↓

Template

↓

Layout

↓

Render Tree
```

Themes provide styling defaults.

Templates override document-specific presentation where applicable.

---

# Validation

Imported templates are validated.

Checks include:

- Missing styles
- Invalid OpenXML
- Corrupt archive
- Unsupported elements
- Missing assets

Validation errors should be descriptive.

---

# Compatibility

Supported:

- Microsoft Word
- Microsoft 365
- LibreOffice generated DOCX
- Google Docs DOCX (best effort)

Unsupported features should degrade gracefully.

---

# Asset Management

Imported assets include:

- Logos
- Images
- Header graphics
- Footer graphics

Assets should be deduplicated and cached.

---

# Versioning

Template profiles should be versioned independently.

Example:

```
Corporate Template

v1.0

↓

v1.1

↓

v2.0
```

Mappings should remain compatible whenever possible.

---

# Future Features

Planned enhancements:

- Template Marketplace
- Organization Template Libraries
- Cloud Template Sync
- Version Comparison
- Template Diff
- Template Merge
- Template Recommendations

---

# Design Principles

The Template Engine should:

- Never modify the original template.
- Never require Microsoft Word.
- Preserve enterprise formatting.
- Be deterministic.
- Be reusable.
- Remain independent of exporters.

---

# Version History

| Version | Date | Notes |
|----------|------|-------|
| 0.1.0 | 2026-07-02 | Initial Template Engine specification |