# ADR 0011: i18n and custom keyboard preferences deferred

## Status

Accepted

## Context

Module 16 lists locale selection and customizable keyboard shortcuts. Seamdoc
MVP targets English-speaking authors with Monaco's built-in keybindings.

## Decision

- **No i18n framework** for MVP; all UI strings remain English.
- **No shortcut customization UI**; Monaco defaults (Find, Replace, etc.) and
  browser shortcuts apply.
- Document **language metadata** (`metadata.language`) is supported for export
  core properties but does not switch UI locale.

## Consequences

- Smaller settings surface; app preferences cover theme, export default, dark
  mode, and high contrast only.
- i18n and shortcut maps can layer onto `AppSettingsPanel` without changing the
  store's document model.
