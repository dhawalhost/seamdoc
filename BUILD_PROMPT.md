# Seamdoc Build Prompt

> Paste everything below this line into a fresh agent session started at the repository root.

---

I'm building **Seamdoc**, an open-source, browser-based platform that turns Markdown into production-ready Microsoft Word documents using themes and templates. It's for developers, technical writers, and documentation teams who write in Markdown but must deliver DOCX. The complete specification already exists in this repository under `docs/` — vision, doctrine, PRD, feature inventory, functional requirements, and twelve architecture documents. Your job is to build the product those documents describe.

With that in mind: implement Seamdoc end to end, starting from an empty repository (only `docs/` exists) and finishing with a working, tested v0.1 (MVP), then continue through the post-MVP milestones.

## Source of truth

The documentation in `docs/` is the specification. Read it before writing any code:

- `docs/00-overview/` — vision and project doctrine (non-negotiable principles)
- `docs/01-product/` — PRD, feature list with P0/P1/P2 priorities, functional requirements with feature IDs
- `docs/02-architecture/` — system overview, folder structure, technology stack, semantic document model, rendering pipeline, document engine, render tree, layout engine, theme engine, template engine, exporter SDK, DOCX exporter

If two documents conflict, prefer the more specific one (architecture doc over PRD over vision), make the smallest reasonable interpretation, and record the decision in an ADR under `docs/03-decisions/`. Do not silently deviate from the docs; if a spec is impractical, write an ADR explaining why and what you did instead.

## Scope and order

Build in this order. Do not start a phase before the previous one's definition of done is met.

**Phase 0 — Workspace.** Scaffold the monorepo exactly as `docs/02-architecture/folder-structure.md` defines, using the stack from `technology-stack.md` (pnpm, Turborepo, TypeScript strict, Vite, Vitest, ESLint, Prettier, Husky, Commitlint, GitHub Actions). Done when: `pnpm install`, `pnpm build`, `pnpm test`, and `pnpm lint` all pass on a clean checkout with placeholder packages.

**Phase 1 — Rendering core (packages first, UI later).** Implement the pipeline from `rendering-pipeline.md`: Markdown → mdast (remark) → Semantic Document Model → Document Engine → Render Tree → Layout Engine → DOCX Exporter (built on the `docx` library, per `docx-exporter.md` and `exporter-sdk.md`), plus the Theme Engine with the built-in themes and Zod-validated theme schema. The pipeline must run with no UI dependency and be deterministic: same Markdown + same configuration = byte-stable document content. Done when: unit tests cover every SDM node type through to DOCX (headings, paragraphs, lists, tables, code blocks with Shiki, images, links, block quotes), and a golden-file test suite locks in rendering output.

**Phase 2 — Web application (MVP, v0.1).** Build the P0 modules from `feature-list.md`: Markdown editor (Monaco), drag-and-drop and file-open, live theme-aware preview with scroll sync, theme switching, document settings (page size, orientation, margins, fonts, spacing, headers/footers, page numbers), DOCX generation and download, application settings with dark/light mode, and the P0 performance and accessibility requirements. All processing stays in the browser — no server round-trips for document data (privacy doctrine). Done when: the MVP success criteria in the PRD pass in a Playwright suite — open the app, write or upload Markdown, see a live preview, pick a theme, adjust settings, download a correct DOCX.

**Phase 3 — Post-MVP milestones.** Follow the release roadmap in `feature-list.md`: v0.2 (template engine and template import per `template-engine.md`, theme import/export, PDF export via the exporter SDK), then v0.3 (plugin SDK). Ship each milestone to the same standard as the MVP before starting the next.

## Working rules

- You are operating autonomously. The user is not watching in real time and cannot answer questions mid-task. For reversible actions that follow from this brief, proceed without asking. Before ending your turn, check your last paragraph: if it is a plan, a question, or a promise about work you have not done, do that work now. End your turn only when the current phase is complete or you are blocked on input only the user can provide.
- When you have enough information to act, act. The docs are thorough; prefer reading them over inventing requirements or asking.
- Don't add features, refactor, or introduce abstractions beyond what the current phase requires. P1/P2 features exist in the docs but are out of scope until their milestone; the exporter SDK's extension points are the only forward-looking abstraction you should build early, because the architecture docs require them.
- Before reporting progress, audit each claim against a tool result from this session. Only report work you can point to evidence for; if tests fail, say so with the output; if a step was skipped, say that.
- Establish a method for checking your own work as you build. At the end of each phase, verify with fresh-context subagents against the relevant docs: one subagent reviews the code against the architecture documents, another runs the full build/test/lint suite from a clean state. Fix what they find before moving on.
- Delegate independent subtasks (e.g. separate packages in Phase 1, or editor vs. preview vs. settings in Phase 2) to subagents and keep working while they run. Intervene if a subagent goes off track or is missing context from the docs.
- Keep a memory file at `notes/build-log.md`: one lesson per entry with a one-line summary, recording corrections and confirmed approaches, including why they mattered. Don't duplicate what git history already records; update or delete entries that turn out to be wrong.
- Commit at every meaningful checkpoint using Conventional Commits (Commitlint is part of the stack). Each commit should leave the repo green: build, tests, lint, and type-check all passing.
- Every package follows the doctrine: single responsibility, no UI dependency in business logic, no hardcoded styling (everything comes from the active theme), semantic nodes before rendering, accessibility treated as a requirement.

When you finish a phase, write your summary for a reader who didn't watch the work: lead with what now works and how it was verified, then anything you need from the user, in complete sentences without working shorthand.

Begin with Phase 0. Read the docs first.
