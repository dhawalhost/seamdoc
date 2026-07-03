import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import {
  autoMapStyles,
  extractPageSettings,
  extractStyles,
  importTemplate,
  TemplateImportError,
  validateTemplateProfile,
} from './import.js';

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/></w:style>
  <w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/></w:style>
  <w:style w:type="paragraph" w:styleId="CodeBlock"><w:name w:val="Code Block"/></w:style>
  <w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/></w:style>
  <w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/></w:style>
</w:styles>`;

const DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p/>
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId7"/>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1800" w:bottom="1440" w:left="1800"/>
    </w:sectPr>
  </w:body>
</w:document>`;

const CORE_XML = `<?xml version="1.0"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:title>Acme Corporate</dc:title>
  <dc:creator>Acme Inc</dc:creator>
</cp:coreProperties>`;

async function buildTemplate(): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file('word/styles.xml', STYLES_XML);
  zip.file('word/document.xml', DOCUMENT_XML);
  zip.file('docProps/core.xml', CORE_XML);
  return zip.generateAsync({ type: 'arraybuffer' });
}

describe('extractStyles', () => {
  it('extracts style ids, names, and types', () => {
    const styles = extractStyles(STYLES_XML);
    expect(styles).toHaveLength(7);
    expect(styles.find((style) => style.id === 'Heading1')).toEqual({
      id: 'Heading1',
      name: 'heading 1',
      type: 'paragraph',
    });
    expect(styles.find((style) => style.id === 'TableGrid')?.type).toBe('table');
  });
});

describe('autoMapStyles', () => {
  it('maps conventional style names to semantic nodes', () => {
    const mapping = autoMapStyles(extractStyles(STYLES_XML));
    expect(mapping.h1).toBe('Heading1');
    expect(mapping.h2).toBe('Heading2');
    expect(mapping.paragraph).toBe('Normal');
    expect(mapping.quote).toBe('Quote');
    expect(mapping.code).toBe('CodeBlock');
    expect(mapping.table).toBe('TableGrid');
    expect(mapping.h3).toBeUndefined();
  });
});

describe('importTemplate', () => {
  it('produces a complete profile from a DOCX template', async () => {
    const profile = await importTemplate(await buildTemplate());
    expect(profile.metadata.name).toBe('Acme Corporate');
    expect(profile.metadata.author).toBe('Acme Inc');
    expect(profile.styles.length).toBeGreaterThan(0);
    expect(profile.mapping.h1).toBe('Heading1');
    expect(profile.pageSettings.pageSize).toBe('Letter');
    expect(profile.pageSettings.orientation).toBe('portrait');
    expect(profile.pageSettings.margins).toEqual({ top: 72, right: 90, bottom: 72, left: 90 });
    expect(profile.hasHeader).toBe(true);
    expect(profile.hasFooter).toBe(false);
    expect(profile.stylesXml).toContain('Heading1');
    expect(validateTemplateProfile(profile).filter((i) => i.severity === 'error')).toEqual([]);
  });

  it('is JSON-serializable', async () => {
    const profile = await importTemplate(await buildTemplate());
    expect(JSON.parse(JSON.stringify(profile))).toEqual(profile);
  });

  it('rejects non-zip data with a descriptive error', async () => {
    await expect(importTemplate(new Uint8Array([1, 2, 3]))).rejects.toThrow(TemplateImportError);
    await expect(importTemplate(new Uint8Array([1, 2, 3]))).rejects.toThrow('not a valid DOCX');
  });

  it('rejects archives that are not Word documents', async () => {
    const zip = new JSZip();
    zip.file('readme.txt', 'not a docx');
    const data = await zip.generateAsync({ type: 'arraybuffer' });
    await expect(importTemplate(data)).rejects.toThrow('missing word/styles.xml');
  });
});

describe('extractPageSettings', () => {
  it('uses the last sectPr when a document has multiple sections', () => {
    const xml = `<w:document><w:body>
      <w:p><w:pPr><w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:pPr></w:p>
      <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr>
    </w:body></w:document>`;
    const settings = extractPageSettings(xml);
    expect(settings.pageSize).toBe('A4');
    expect(settings.margins).toEqual({ top: 36, right: 36, bottom: 36, left: 36 });
  });
});

describe('validateTemplateProfile', () => {
  it('flags mappings that reference unknown styles', async () => {
    const profile = await importTemplate(await buildTemplate());
    const broken = { ...profile, mapping: { ...profile.mapping, h1: 'DoesNotExist' } };
    const issues = validateTemplateProfile(broken);
    expect(issues.some((issue) => issue.severity === 'error')).toBe(true);
  });
});
