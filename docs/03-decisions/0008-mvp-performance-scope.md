# ADR 0008: MVP performance scope — lazy load yes, virtualization deferred

## Status

Accepted

## Context

The audit (Modules 17–18) called out lazy loading, list virtualization, and
large-document optimizations. The MVP must stay shippable without building a
full performance subsystem.

## Decision

- **Lazy-load Monaco** via `React.lazy` in `apps/web/src/App.tsx` so the initial
  bundle pays for the editor only when the editor pane mounts.
- **Keep Shiki eager** at startup (`initHighlighter` in `main.tsx`) because
  syntax highlighting is on the critical preview path and the web bundle is
  already tree-shaken.
- **Defer list virtualization** for preview pages and the editor until document
  sizes routinely exceed comfortable in-browser limits (tracked post-MVP).
- **Defer incremental layout** and worker-based rendering; the layout engine
  runs synchronously on the main thread for MVP documents.

## Consequences

- First paint is faster when users land on print-preview-only layouts.
- Very large Markdown files may stutter during layout; acceptable for MVP.
- Future work can add `@seamdoc/preview` virtualization without changing the
  Render Tree contract.
