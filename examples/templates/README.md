# Sample templates

Place a corporate `.docx` template here for manual testing. The template
engine (`@seamdoc/templates`) will:

1. Extract styles from `word/styles.xml`
2. Auto-map conventional names (Heading 1, Normal, Quote, …) to semantic nodes
3. Preserve page size, orientation, and margins
4. Embed the template styles into DOCX exports

Import a template in the web app via the layout-template toolbar button, or
call `importTemplate()` from `@seamdoc/templates` in a script.

The original file is never modified (read-only import).
