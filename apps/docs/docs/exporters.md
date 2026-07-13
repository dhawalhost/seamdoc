# Exporters

Seamdoc comes built-in with multiple production-ready exporters.

## PDF Exporter

Produces highly accurate PDFs utilizing `pdf-lib`.
- Features password protection and document encryption.
- Allows embedding custom TTF/OTF fonts for rich typography (Greek, Cyrillic, CJK, etc.).
- Consumes the fully-positioned Render Tree.

## DOCX Exporter

Produces Microsoft Word `.docx` documents utilizing `docx` library.
- Honors template style mappings.
- Reuses template headers, footers, margins, and page sizes.

## EPUB Exporter

New EPUB 3 compliant book exporter.
- Generates standard `mimetype`, manifests, spin, and Table of Contents files.
- Packages chapters and images into a valid `.epub` ZIP structure client-side.
