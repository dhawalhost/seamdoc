# Contributing to Seamdoc

First off, thank you for considering contributing to Seamdoc! This document outlines the setup guidelines, architecture overview, and code style expectations to help you get started.

## Developer Setup Guidelines

### Prerequisites

- **Node.js**: Version `>=22.12`
- **pnpm**: Package manager (specified in packageManager package.json configuration)

### Getting Started

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/seamdoc/seamdoc.git
   cd seamdoc
   ```
2. **Install Dependencies**:
   ```bash
   pnpm install
   ```
3. **Run the Web Application (Local Development)**:
   ```bash
   pnpm --filter @seamdoc/web dev
   ```
   Open `http://localhost:5173` in your browser.
4. **Run the Documentation Site**:
   ```bash
   pnpm --filter @seamdoc/docs dev
   ```

---

## Architecture & Rendering Pipeline Overview

Seamdoc's multi-stage rendering pipeline decouples content representation from visual styles:

```
[Markdown Input]
       │
       ▼  (packages/parser)
  [mdast AST]
       │
       ▼  (packages/semantic-model)
 [Semantic Document Model (SDM)]
       │
       ▼  (packages/renderer)
  [Render Tree (absolute layout)]
       │
       ├──────────────────────────┐
       ▼                          ▼
[PDF Exporter]             [DOCX Exporter]
(packages/exporters/pdf)   (packages/exporters/docx)
```

1. **Parser** (`@seamdoc/parser`): Parses Markdown into a standard MDAST representation.
2. **Semantic Model** (`@seamdoc/semantic-model`): Converts MDAST into the format-neutral **Semantic Document Model (SDM)**, strips markdown specifics, and handles GFM Footnotes & Table of Contents (TOC).
3. **Renderer** (`@seamdoc/renderer`): Applies active themes and document settings on top of the SDM, measures text widths/heights, paginates blocks, and produces a fully positioned **Render Tree**.
4. **Exporters** (`@seamdoc/exporter-*`): Serializes the Render Tree into native target binary packages (DOCX, PDF, EPUB, etc.) entirely client-side.

---

## Code Style & Pull Request Guidelines

### Code Quality Checklists

Before submitting a PR, make sure your code passes all linting, formatting, and unit/E2E checks:

- **Linting**:
  ```bash
  pnpm lint
  ```
- **Type Checking**:
  ```bash
  pnpm typecheck
  ```
- **Formating**:
  ```bash
  pnpm format:check  # Check formatting
  pnpm format        # Format files with Prettier
  ```
- **Unit and Integration Tests**:
  ```bash
  pnpm test
  ```
- **End-to-End Playwright Tests**:
  ```bash
  pnpm --filter @seamdoc/web test:e2e
  ```

### Commit Message Guidelines

We enforce conventional commits format (verified automatically in CI):

- **feat**: A new feature (e.g. `feat: add epub exporter support`)
- **fix**: A bug fix (e.g. `fix: solve low color contrast in header`)
- **docs**: Documentation only changes (e.g. `docs: add contributing guidelines`)
- **style**: Changes that do not affect the meaning of the code (formatting, white-space)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **test**: Adding missing tests or correcting existing tests
