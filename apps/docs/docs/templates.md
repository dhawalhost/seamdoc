# Templates

Word templates allow reusing pre-designed corporate letterheads and styles.

## How it works

When a template is loaded in Seamdoc:
1. The template parser reads the underlying XML files inside the `.docx` archive.
2. The user maps semantic block types (e.g., `heading 1`, `paragraph`) to the styles defined in the template (e.g., `TitleStyle`, `CustomBody`).
3. During export, the DOCX exporter merges the template's style definitions and maps each block type to its native style ID.
4. Word resolves the layout dynamically when opened by the user.
