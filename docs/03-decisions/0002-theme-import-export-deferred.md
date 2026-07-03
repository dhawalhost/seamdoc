---
title: "ADR 0002: Theme import/export deferred to v0.2"
status: Superseded
date: 2026-07-03
superseded-by: "v0.2 shipped theme import/export in apps/web"
---

# Context

`docs/01-product/feature-list.md` contains a conflict: Module 4 (Theme
Engine) is marked P0 and lists "Theme Import" and "Theme Export" among its
features, but the Release Roadmap in the same document schedules "Theme
Import" for Version 0.2, and the MVP Scope section describes v0.1 as built-in
themes plus theme switching.

# Decision

Following the documented conflict rule (prefer the more specific statement),
the release roadmap wins: v0.1 ships the seven built-in themes, theme
switching, validation, and metadata. Theme import/export ships in v0.2
alongside the template engine.

The theme schema and `validateTheme` already exist in `packages/themes`, so
import support in v0.2 is a UI and file-handling task, not an engine change.

# Consequences

- The v0.1 web app has no theme import/export UI.
- v0.2 must add: theme JSON file import with validation errors surfaced to the
  user, and export of the active theme as a JSON package.

# Superseded

v0.2 implemented theme import and export in the web app (`ThemePanel` /
settings UI). This ADR remains as historical context for the feature-list
conflict resolution; new work should treat theme import/export as shipped.
