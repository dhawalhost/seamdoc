# ADR 0010: Preview, UI, and hooks remain in apps/web for MVP

## Status

Accepted

## Context

The architecture folder structure reserves `packages/preview`, `packages/ui`, and
`packages/hooks` for shared client code. The MVP web app already colocates
preview rendering, Zustand store, and toolbar panels under `apps/web`.

## Decision

- Keep **preview pane**, **application state**, and **React hooks** inside
  `apps/web` until a second consumer (e.g. embeddable widget or VS Code webview)
  requires extraction.
- Shared rendering stays in `@seamdoc/core`, `@seamdoc/renderer`, and exporters;
  the web layer is a thin host.

## Consequences

- No premature package boundaries; faster iteration on MVP UX.
- Extraction checklist for v0.4+: move `PreviewPane`, scroll-sync hooks, and
  zoom utilities into `packages/preview` with unchanged props.
