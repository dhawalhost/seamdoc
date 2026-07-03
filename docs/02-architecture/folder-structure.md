---
title: Folder Structure
version: 0.1.0
status: Draft
owner: Engineering
last_updated: 2026-07-02
---

# Folder Structure

## Overview

This document defines the monorepo layout for Seamdoc.

The project is organized into independent applications and reusable packages.

Every package should have a single responsibility and expose a clear public API.

---

# Design Goals

The repository should be:

- Modular
- Scalable
- Easy to navigate
- Easy to test
- Easy to extend
- Open Source friendly
- Cursor friendly

---

# Monorepo Layout

```text
.
├── apps/
├── packages/
├── docs/
├── examples/
├── scripts/
├── assets/
├── tests/
├── .github/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

# apps/

Applications that users directly interact with.

```text
apps/
├── web/
├── docs/
└── playground/
```

---

## apps/web

The primary application.

Responsibilities:

- React UI
- Navigation
- Editor
- Preview
- Settings
- Theme Browser
- Export Workflow

Technology:

- React
- Vite
- TypeScript
- Tailwind CSS

---

## apps/docs

Documentation website.

Possible frameworks:

- Docusaurus
- Astro Starlight
- VitePress

---

## apps/playground

Internal development environment.

Used for:

- Renderer testing
- Theme development
- Plugin development
- Component testing

Not shipped to production.

---

# packages/

Reusable libraries.

Everything inside packages should be framework independent whenever possible.

```text
packages/
├── core/
├── parser/
├── ast/
├── semantic-model/
├── renderer/
├── preview/
├── exporters/
├── themes/
├── templates/
├── plugins/
├── ui/
├── hooks/
├── utils/
├── shared/
├── config/
└── types/
```

---

# packages/core

The orchestration layer.

Responsibilities:

- Document pipeline
- Feature coordination
- Rendering workflow
- Configuration

The core package contains business logic but no UI.

---

# packages/parser

Converts Markdown into an Abstract Syntax Tree.

Input:

Markdown

Output:

AST

Supported formats may expand in future releases.

---

# packages/ast

Contains AST node definitions.

Example nodes:

- Heading
- Paragraph
- List
- Table
- Image
- Link
- Quote
- Code Block

No rendering logic.

---

# packages/semantic-model

Transforms the AST into a semantic document model.

Renderers consume this model instead of raw Markdown.

This layer keeps rendering independent of input formats.

---

# packages/renderer

Responsible for converting semantic nodes into renderable document elements.

The renderer contains no UI code.

---

# packages/preview

Generates the live preview shown inside the web application.

Should match exported documents as closely as possible.

---

# packages/exporters

Each export format is implemented independently.

```text
exporters/
├── docx/
├── pdf/
├── html/
├── odt/
└── epub/
```

Only DOCX is required for MVP.

---

# packages/themes

Contains:

- Built-in themes
- Theme schema
- Theme validation
- Theme utilities

Community themes will also use this package.

---

# packages/templates

Responsible for:

- DOCX Template Import
- Style Extraction
- Template Mapping
- Template Profiles

Introduced after MVP.

---

# packages/plugins

Plugin SDK.

Responsibilities:

- Plugin API
- Registration
- Lifecycle
- Validation
- Plugin loading

---

# packages/ui

Shared React components.

Examples:

- Buttons
- Dialogs
- Panels
- Cards
- Forms
- Inputs
- Navigation

No business logic.

---

# packages/hooks

Reusable React hooks.

Examples:

- useTheme
- useDocument
- useRenderer
- usePreview
- useExport

---

# packages/utils

Generic utility functions.

Examples:

- File Helpers
- Formatting
- Validation
- String Utilities

No platform-specific logic.

---

# packages/shared

Shared constants.

Examples:

- Icons
- Enums
- Default Values
- Configuration

---

# packages/config

Configuration used throughout the monorepo.

Examples:

- ESLint
- Prettier
- Tailwind
- TypeScript
- Vitest

---

# packages/types

Shared TypeScript types.

Avoid duplicate interfaces across packages.

---

# docs/

Project documentation.

Contains:

- Product
- Architecture
- UI
- Engineering
- ADRs

---

# examples/

Sample Markdown files.

Sample themes.

Sample templates.

Reference documents.

Used for testing and demonstrations.

---

# scripts/

Automation scripts.

Examples:

- Build
- Release
- Documentation
- Validation

---

# tests/

Repository-wide testing.

```text
tests/
├── unit/
├── integration/
├── e2e/
├── fixtures/
└── snapshots/
```

---

# assets/

Static assets.

Examples:

- Logos
- Icons
- Images
- Sample Documents

---

# .github/

Repository automation.

```text
.github/
├── workflows/
├── ISSUE_TEMPLATE/
├── PULL_REQUEST_TEMPLATE.md
├── CODEOWNERS
└── FUNDING.yml
```

---

# Package Rules

Every package must:

- Have a single responsibility.
- Export a clear public API.
- Include tests.
- Include documentation.
- Avoid circular dependencies.
- Remain independently buildable whenever possible.

---

# Dependency Direction

```
Applications

↓

Core

↓

Renderer

↓

Semantic Model

↓

AST

↓

Parser

↓

Utilities
```

Lower-level packages must never depend on higher-level packages.

---

# Naming Convention

Packages use lowercase kebab-case.

Examples:

- semantic-model
- theme-engine
- template-engine

Avoid abbreviations unless universally understood.

---

# Future Packages

Potential additions:

```text
packages/
├── ai/
├── collaboration/
├── github/
├── analytics/
├── marketplace/
├── sdk/
└── cli/
```

These should remain optional and should not introduce dependencies into the core rendering engine.

---

# Repository Principles

The repository should remain:

- Modular
- Extensible
- Testable
- Well documented
- Contributor friendly
- AI friendly

A contributor should be able to locate any feature within a few minutes.

---

# Version History

| Version | Date | Notes |
|----------|------|-------|
| 0.1.0 | 2026-07-02 | Initial monorepo structure |