import { expect, test } from '@playwright/test';
import JSZip from 'jszip';

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>
  <w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/></w:style>
</w:styles>`;

const DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p/>
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

const CORE_XML = `<?xml version="1.0"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:title>Acme Corporate</dc:title>
</cp:coreProperties>`;

async function buildTemplateDocx(): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('word/styles.xml', STYLES_XML);
  zip.file('word/document.xml', DOCUMENT_XML);
  zip.file('docProps/core.xml', CORE_XML);
  return zip.generateAsync({ type: 'nodebuffer' });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('imports a DOCX template and applies it to the export', async ({ page }) => {
  await page.getByTestId('template-file-input').setInputFiles({
    name: 'acme.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: await buildTemplateDocx(),
  });

  // The template becomes active and preserves its page setup (Letter).
  await expect(page.getByTestId('active-template')).toContainText('Acme Corporate');
  await page.getByTestId('settings-toggle').click();
  await expect(page.getByTestId('page-size')).toHaveValue('Letter');
  await expect(page.getByTestId('mapping-h1')).toHaveValue('Heading1');
  await expect(page.getByTestId('mapping-paragraph')).toHaveValue('Normal');

  // Exported DOCX references the template's style ids and embeds styles.xml.
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-button').click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const zip = await JSZip.loadAsync(Buffer.concat(chunks));
  const documentXml = await zip.file('word/document.xml')!.async('string');
  expect(documentXml).toContain('<w:pStyle w:val="Heading1"/>');
  expect(documentXml).toContain('<w:pStyle w:val="Normal"/>');
  const stylesXml = await zip.file('word/styles.xml')!.async('string');
  expect(stylesXml).toContain('Heading1');
});

test('mapping can be adjusted and the template removed', async ({ page }) => {
  await page.getByTestId('template-file-input').setInputFiles({
    name: 'acme.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: await buildTemplateDocx(),
  });
  await expect(page.getByTestId('active-template')).toBeVisible();

  await page.getByTestId('settings-toggle').click();
  await expect(page.getByTestId('page-size')).toHaveValue('Letter');
  await page.getByTestId('mapping-h1').selectOption('Quote');
  await expect(page.getByTestId('mapping-h1')).toHaveValue('Quote');

  await page.getByTestId('remove-template').click();
  await expect(page.getByTestId('active-template')).not.toBeVisible();
  await expect(page.getByTestId('template-mapping')).not.toBeVisible();
  // Removing the template restores the page setup it had overridden (A4 default).
  await expect(page.getByTestId('page-size')).toHaveValue('A4');
});

test('rejects a non-DOCX template file with a visible error', async ({ page }) => {
  await page.getByTestId('template-file-input').setInputFiles({
    name: 'broken.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from('not a zip archive'),
  });
  await expect(page.getByTestId('template-error')).toContainText('Template import failed');
});
