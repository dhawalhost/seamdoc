---
title: Technology Stack
version: 0.1.0
status: Draft
owner: Engineering
last_updated: 2026-07-02
---

# Technology Stack

## Overview

This document defines the official technology stack for the project.

Technology choices are based on the following principles:

- Modern developer experience
- Strong TypeScript ecosystem
- Excellent browser support
- High performance
- Active open-source community
- Long-term maintainability
- AI-assisted development friendliness

Technology changes should be documented through an ADR (Architecture Decision Record).

---

# High-Level Stack

| Layer | Technology |
|---------|------------|
| Language | TypeScript |
| Runtime | Node.js |
| Package Manager | pnpm |
| Monorepo | Turborepo |
| Frontend | React |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Icons | Lucide React |
| State Management | Zustand |
| Forms | React Hook Form |
| Validation | Zod |
| Markdown Parser | remark |
| Markdown AST | mdast |
| Syntax Highlighting | Shiki |
| Editor | Monaco Editor |
| DOCX Generation | docx |
| Testing | Vitest |
| Component Testing | Storybook |
| E2E Testing | Playwright |
| Linting | ESLint |
| Formatting | Prettier |
| Git Hooks | Husky |
| Commit Standards | Commitlint |
| CI/CD | GitHub Actions |

---

# Frontend

## React

Purpose:

- User Interface
- Component Architecture
- Rendering

Reasons:

- Large ecosystem
- Excellent TypeScript support
- Mature community
- Rich editor ecosystem

---

## Vite

Purpose:

- Development Server
- Build Tool

Reasons:

- Extremely fast
- Excellent React support
- Modern tooling
- Minimal configuration

---

## TypeScript

Purpose:

Primary programming language.

Reasons:

- Strong typing
- Better refactoring
- AI-friendly
- Better maintainability

JavaScript should not be used unless absolutely necessary.

---

# Styling

## Tailwind CSS

Purpose:

Application styling.

Reasons:

- Fast development
- Small bundle size
- Easy theming
- Consistent design system

---

## shadcn/ui

Purpose:

Reusable UI components.

Reasons:

- Accessible
- Modern
- Fully customizable
- No runtime dependency
- Excellent developer experience

---

## Lucide React

Purpose:

Icons.

Reasons:

- Open Source
- Lightweight
- Consistent
- Tree-shakeable

---

# State Management

## Zustand

Purpose:

Global application state.

Reasons:

- Minimal API
- Excellent TypeScript support
- No boilerplate
- Easy testing

Global state should only contain application-level data.

Editor state should remain local whenever possible.

---

# Forms

## React Hook Form

Purpose:

Complex forms.

Examples:

- Document Settings
- Theme Configuration
- Template Configuration

---

## Zod

Purpose:

Validation.

Used for:

- Form validation
- Theme schema validation
- Configuration validation
- API validation

---

# Markdown

## remark

Purpose:

Markdown parsing.

Input:

Markdown

Output:

AST

Chosen because of its mature plugin ecosystem.

---

## mdast

Purpose:

Standard Markdown Abstract Syntax Tree.

Acts as the intermediate representation before semantic conversion.

---

# Code Highlighting

## Shiki

Purpose:

Syntax highlighting.

Used in:

- Editor preview
- Live preview
- Exported code blocks

Reasons:

- VS Code quality highlighting
- Accurate tokenization
- Modern themes

---

# Editor

## Monaco Editor

Purpose:

Markdown editing.

Reasons:

- Professional editing experience
- Rich keyboard shortcuts
- Fast
- Extensible
- Familiar to developers

---

# Document Generation

## docx

Purpose:

Generate Microsoft Word documents.

Reasons:

- Pure TypeScript
- Browser compatible
- Active community
- Open source

This library forms the foundation of the DOCX exporter.

---

# Testing

## Vitest

Purpose:

Unit testing.

Reasons:

- Fast
- Native Vite integration
- TypeScript support

---

## Storybook

Purpose:

Component development.

Benefits:

- Visual testing
- Component documentation
- Isolated UI development

---

## Playwright

Purpose:

End-to-end testing.

Used for:

- Editor workflows
- Export workflows
- Browser compatibility

---

# Code Quality

## ESLint

Static code analysis.

---

## Prettier

Code formatting.

---

## Husky

Git hooks.

Used for:

- Linting
- Formatting
- Testing

before commits.

---

## Commitlint

Enforces conventional commits.

Example:

```
feat(editor): add markdown upload

fix(renderer): improve table rendering

docs(prd): update requirements
```

---

# Package Management

## pnpm

Reasons:

- Fast
- Disk efficient
- Excellent monorepo support

---

## Turborepo

Purpose:

Monorepo orchestration.

Responsibilities:

- Build caching
- Incremental builds
- Task pipelines
- Package dependencies

---

# Documentation

Documentation should be written in Markdown.

Potential documentation site:

- Astro Starlight
- VitePress
- Docusaurus

Decision deferred.

---

# CI/CD

GitHub Actions will be used.

Primary workflows:

- Build
- Test
- Lint
- Type Check
- Release
- Documentation

---

# Browser Support

Officially supported browsers:

- Chrome
- Edge
- Firefox
- Safari

Only the latest stable versions are guaranteed.

---

# Future Technologies

These are intentionally excluded from MVP but may be adopted later.

- Tauri
- Electron
- Next.js
- WebAssembly
- CRDT
- Yjs
- IndexedDB
- Supabase
- Cloudflare Workers

---

# Technology Principles

The project prefers:

- Open standards
- Open-source software
- Browser-native APIs
- Small dependencies
- Well-maintained libraries
- TypeScript-first packages

Avoid dependencies that:

- Have unclear maintenance
- Are overly complex
- Introduce vendor lock-in
- Duplicate existing functionality

---

# Technology Review

Technology choices should be reviewed before every major release.

Major replacements require an ADR.

---

# Version History

| Version | Date | Notes |
|----------|------|-------|
| 0.1.0 | 2026-07-02 | Initial technology stack |