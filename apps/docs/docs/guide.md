# What is Seamdoc?

Seamdoc is a modern, open-source document rendering platform. It is designed to take raw Markdown text as input and produce production-ready, beautifully typeset Microsoft Word (DOCX), PDF, ODT, and EPUB files.

Unlike traditional static site generators or document converters (like Pandoc) that translate markup directly to a target format, Seamdoc uses a multi-stage compilation pipeline:

1. **Parser**: Parses Markdown text into a standard Abstract Syntax Tree (mdast).
2. **Semantic Model**: Translates mdast into a **Semantic Document Model (SDM)**, decoupling the document structure from Markdown-specific concepts.
3. **Layout Engine**: Resolves styles, measures text boundaries, applies templates, and positions blocks into a versioned **Render Tree**.
4. **Exporters**: Serializes the Render Tree into native target binary packages (like DOCX, PDF, EPUB).

All rendering and formatting are performed client-side inside the web browser with zero network dependencies.
