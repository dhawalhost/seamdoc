# ADR 0009: shadcn/ui deferred — Tailwind utility classes for MVP

## Status

Accepted

## Context

`docs/02-architecture/folder-structure.md` lists `packages/ui` for shared
components. The audit noted shadcn/ui as a likely fit for accessible controls.
Adding a component library mid-MVP would expand scope without changing export
semantics.

## Decision

- Build MVP UI with **Tailwind CSS utility classes** directly in
  `apps/web/src/components`.
- **Do not** add shadcn/ui, Radix wrappers, or a `packages/ui` package for MVP.
- Revisit when multiple surfaces (web app, plugin host, Storybook) need the
  same primitives.

## Consequences

- UI consistency is enforced by convention and shared `fieldClass` patterns.
- Accessibility baseline (focus rings, landmarks, skip link) is implemented
  manually in `index.css` and component markup.
- Extracting `packages/ui` remains a post-MVP refactor with clear boundaries.
