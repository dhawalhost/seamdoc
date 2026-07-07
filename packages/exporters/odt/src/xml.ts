/**
 * ODT XML construction helpers.
 * Builds the XML files that compose an ODT document ZIP:
 *   - content.xml  (body content)
 *   - styles.xml   (paragraph and character styles)
 *   - meta.xml     (document metadata)
 *   - mimetype     (must be first, uncompressed)
 *   - META-INF/manifest.xml
 */

import type { DocumentMetadata } from '@seamdoc/types';

/** Escapes special characters for XML text nodes. */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Builds meta.xml from document metadata. */
export function buildMetaXml(metadata: DocumentMetadata): string {
  const date = metadata.createdAt || new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  office:version="1.3">
  <office:meta>
    <dc:title>${escapeXml(metadata.title)}</dc:title>
    <dc:creator>${escapeXml(metadata.author)}</dc:creator>
    <dc:description>${escapeXml(metadata.description)}</dc:description>
    <dc:date>${escapeXml(date)}</dc:date>
    <meta:generator>SeamDoc ODT Exporter 0.1.0</meta:generator>
  </office:meta>
</office:document-meta>`;
}

/** Builds styles.xml with paragraph and character style definitions. */
export function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  office:version="1.3">
  <office:styles>
    <style:style style:name="Standard" style:family="paragraph" style:class="text">
      <style:text-properties fo:font-size="12pt" fo:font-family="Liberation Serif"/>
    </style:style>
    <style:style style:name="Heading_1" style:display-name="Heading 1" style:family="paragraph" style:parent-style-name="Standard" style:next-style-name="Standard">
      <style:paragraph-properties fo:margin-top="12pt" fo:margin-bottom="6pt"/>
      <style:text-properties fo:font-size="20pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Heading_2" style:display-name="Heading 2" style:family="paragraph" style:parent-style-name="Standard" style:next-style-name="Standard">
      <style:paragraph-properties fo:margin-top="10pt" fo:margin-bottom="4pt"/>
      <style:text-properties fo:font-size="16pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Heading_3" style:display-name="Heading 3" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="14pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Code" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:background-color="#f4f4f4" fo:padding="4pt"/>
      <style:text-properties fo:font-family="Liberation Mono" fo:font-size="10pt"/>
    </style:style>
    <style:style style:name="Quotations" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:margin-left="20pt" fo:border-left="2pt solid #cccccc" fo:padding-left="8pt"/>
    </style:style>
    <style:style style:name="Bold" style:family="text">
      <style:text-properties fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Italic" style:family="text">
      <style:text-properties fo:font-style="italic"/>
    </style:style>
    <style:style style:name="Underline" style:family="text">
      <style:text-properties style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color"/>
    </style:style>
    <style:style style:name="InlineCode" style:family="text">
      <style:text-properties fo:font-family="Liberation Mono" fo:background-color="#f0f0f0"/>
    </style:style>
  </office:styles>
  <office:automatic-styles/>
  <office:master-styles>
    <style:master-page style:name="Standard" style:page-layout-name="pm1"/>
  </office:master-styles>
</office:document-styles>`;
}

/** Builds the manifest.xml for the META-INF directory. */
export function buildManifestXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest
  xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"
  manifest:version="1.3">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text" manifest:version="1.3"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;
}

/** Wraps a complete content.xml document around serialized body XML. */
export function buildContentXml(bodyXml: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  office:version="1.3">
  <office:automatic-styles/>
  <office:body>
    <office:text>
${bodyXml}
    </office:text>
  </office:body>
</office:document-content>`;
}
