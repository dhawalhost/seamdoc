# ADR 0005: v0.3 ships the Plugin SDK; Marketplace and GitHub integration deferred

## Status

Accepted

## Context

The release roadmap in `docs/01-product/feature-list.md` lists v0.3 as
"Plugin SDK, Marketplace, GitHub Integration". The Marketplace (ratings,
reviews, downloads, search) and GitHub integration are inherently
server-backed features: they require hosted infrastructure, accounts, and
network services that do not exist yet, and the feature list itself marks
the Marketplace as P2. Everything shipped so far runs entirely in the
browser with no backend.

## Decision

v0.3 ships the Plugin SDK only (`packages/plugins` per
`folder-structure.md`): plugin API, registration, lifecycle hooks,
structural validation, isolated execution (a failing plugin is disabled and
rendering continues, per the rendering-pipeline error-handling spec), and a
code-block transform helper covering the documented Mermaid-style use case.
The core pipeline accepts a `PluginRegistry` and runs it between SDM
validation and layout (Stage 7), surfacing plugin diagnostics as pipeline
warnings.

Marketplace and GitHub integration are deferred until a backend exists.

## Consequences

- Third-party rendering extensions are possible today via the SDK; there is
  no in-app distribution channel yet.
- No plugin management UI ships in v0.3: plugins are P1 features and the
  web app has no way to safely load arbitrary user code without a
  review/distribution story, which is exactly the deferred Marketplace.
