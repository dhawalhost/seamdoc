import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { renderMarkdown } from '@seamdoc/core';
import { DEFAULT_DOCUMENT_METADATA } from '@seamdoc/shared';
import { docxExporter } from './index.js';

const FIXTURE_MARKDOWN = `# Seamdoc Golden Document

An introduction paragraph with **bold**, *italic*, \`inline code\`, and a
[link](https://example.com).

## Lists

1. First
2. Second

- Bullet one
- Bullet two

## Table

| Name | Role |
| :--- | ---: |
| Ada  | Engineer |

> A block quote to verify quote styling.

\`\`\`typescript
const answer = 42;
\`\`\`

---

Final paragraph.
`;

async function exportFixture(theme = 'minimal') {
  const outcome = renderMarkdown(FIXTURE_MARKDOWN, {
    theme,
    metadata: { title: 'Golden' },
    settings: { header: 'Seamdoc', footer: '', pageNumbers: true },
  });
  return docxExporter.export(outcome.renderDocument, {
    filename: 'golden',
    metadata: { ...DEFAULT_DOCUMENT_METADATA, title: 'Golden' },
  });
}

/**
 * Relationship IDs (r:id) are generated randomly by the docx library and are
 * Word-internal identifiers with no user-visible effect; they are normalized
 * before comparison (see docs/03-decisions/0001-docx-relationship-ids.md).
 */
function normalizeRelationshipIds(xml: string): string {
  return xml
    .replace(/r:id="rId[^"]*"/g, 'r:id="rId-NORMALIZED"')
    .replace(/Id="rId[^"]*"/g, 'Id="rId-NORMALIZED"');
}

async function extractDocumentXml(data: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(data);
  const file = zip.file('word/document.xml');
  expect(file).not.toBeNull();
  return normalizeRelationshipIds(await file!.async('string'));
}

async function extractRels(data: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(data);
  const file = zip.file('word/_rels/document.xml.rels');
  expect(file).not.toBeNull();
  return file!.async('string');
}

describe('DocxExporter', () => {
  it('declares the exporter SDK contract', () => {
    expect(docxExporter.id).toBe('docx');
    expect(docxExporter.supports('docx')).toBe(true);
    expect(docxExporter.supports('pdf')).toBe(false);
  });

  it('produces a valid DOCX package', async () => {
    const result = await exportFixture();
    expect(result.filename).toBe('golden.docx');
    expect(result.mimeType).toContain('wordprocessingml');
    // DOCX files are ZIP archives: PK magic bytes.
    const bytes = new Uint8Array(result.data.slice(0, 2));
    expect([...bytes]).toEqual([0x50, 0x4b]);

    const zip = await JSZip.loadAsync(result.data);
    expect(zip.file('word/document.xml')).not.toBeNull();
    expect(zip.file('[Content_Types].xml')).not.toBeNull();
  });

  it('serializes every fixture node type into document.xml', async () => {
    const result = await exportFixture();
    const xml = await extractDocumentXml(result.data);
    expect(xml).toContain('Seamdoc Golden Document');
    expect(xml).toContain('<w:tbl>');
    expect(xml).toContain('const answer = 42;');
    expect(xml).toContain('<w:hyperlink');
    expect(xml).toContain('Final paragraph.');
    // Hyperlink targets live in the relationships part of the package.
    const rels = await extractRels(result.data);
    expect(rels).toContain('https://example.com');
  });

  it('is deterministic: same input produces identical document.xml', async () => {
    const [a, b] = await Promise.all([exportFixture(), exportFixture()]);
    const [xmlA, xmlB] = await Promise.all([
      extractDocumentXml(a.data),
      extractDocumentXml(b.data),
    ]);
    expect(xmlA).toBe(xmlB);
  });

  it('matches the golden snapshot of document.xml', async () => {
    const result = await exportFixture();
    const xml = await extractDocumentXml(result.data);
    expect(xml).toMatchSnapshot();
  });

  it('themes change styling without changing content', async () => {
    const minimal = await extractDocumentXml((await exportFixture('minimal')).data);
    const github = await extractDocumentXml((await exportFixture('github')).data);
    expect(minimal).not.toBe(github);
    expect(github).toContain('Seamdoc Golden Document');
  });

  it('applies a template: embedded styles.xml and mapped paragraph styles', async () => {
    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="AcmeHeading1"><w:name w:val="Acme Heading 1"/></w:style>
  <w:style w:type="paragraph" w:styleId="AcmeBody"><w:name w:val="Acme Body"/></w:style>
</w:styles>`;
    const outcome = renderMarkdown(FIXTURE_MARKDOWN, { theme: 'minimal' });
    const result = await docxExporter.export(outcome.renderDocument, {
      filename: 'templated',
      metadata: DEFAULT_DOCUMENT_METADATA,
      template: {
        stylesXml,
        mapping: { h1: 'AcmeHeading1', paragraph: 'AcmeBody' },
      },
    });

    const zip = await JSZip.loadAsync(result.data);
    const embeddedStyles = await zip.file('word/styles.xml')!.async('string');
    expect(embeddedStyles).toContain('AcmeHeading1');

    const xml = await extractDocumentXml(result.data);
    expect(xml).toContain('<w:pStyle w:val="AcmeHeading1"/>');
    expect(xml).toContain('<w:pStyle w:val="AcmeBody"/>');
    // Template-styled paragraphs must not carry direct font formatting.
    const headingChunk = xml.slice(xml.indexOf('AcmeHeading1'), xml.indexOf('Golden Document'));
    expect(headingChunk).not.toContain('<w:rFonts');
  });

  it('rejects render trees with a wrong version', async () => {
    const outcome = renderMarkdown('x');
    const broken = { ...outcome.renderDocument, version: 99 };
    await expect(
      docxExporter.export(broken, {
        filename: 'x',
        metadata: DEFAULT_DOCUMENT_METADATA,
      }),
    ).rejects.toThrow('Unsupported render tree version');
  });
});
