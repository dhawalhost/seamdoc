/**
 * MVP end-to-end workflow (docs/01-product/prd.md success criteria):
 * open the app, write or upload Markdown, view a live preview, pick a theme,
 * adjust settings, and download a correct DOCX.
 */

import { expect, test, type Download } from '@playwright/test';
import JSZip from 'jszip';

async function downloadBuffer(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

test.beforeEach(async ({ page }) => {
  // Clear persisted state once, then reload; addInitScript would also wipe
  // storage on in-test reloads and break persistence tests.
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('loads with editor, preview, and sample document', async ({ page }) => {
  await expect(page.getByTestId('editor')).toBeVisible();
  await expect(page.getByTestId('preview')).toBeVisible();
  await expect(page.getByTestId('preview')).toContainText('Welcome to Seamdoc');
  await expect(page.getByTestId('preview-page').first()).toBeVisible();
});

test('editing markdown updates the live preview', async ({ page }) => {
  await page.locator('.monaco-editor').first().click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a');
  await page.keyboard.type('# Fresh Heading\n\nNew body text.');
  await expect(page.getByTestId('preview')).toContainText('Fresh Heading');
  await expect(page.getByTestId('preview')).toContainText('New body text.');
});

test('switching theme changes preview styling without changing content', async ({ page }) => {
  const heading = page.locator('[data-preview="heading"]').first().locator('span').first();
  const before = await heading.evaluate((el) => getComputedStyle(el).color);

  await page.getByTestId('theme-select').selectOption('modern');

  await expect(page.getByTestId('preview')).toContainText('Welcome to Seamdoc');
  await expect
    .poll(async () => heading.evaluate((el) => getComputedStyle(el).color))
    .not.toBe(before);
});

test('document settings change the preview pages', async ({ page }) => {
  await page.getByTestId('settings-toggle').click();
  await expect(page.getByTestId('settings-panel')).toBeVisible();

  // The on-screen box is clamped by the pane width, so assert on the page's
  // declared width (points), which reflects the selected orientation.
  const pageBox = page.getByTestId('preview-page').first();
  const declaredWidth = () => pageBox.evaluate((el) => parseFloat(el.style.width));
  const portraitWidth = await declaredWidth();

  await page.getByTestId('orientation').selectOption('landscape');
  await expect.poll(declaredWidth).toBeGreaterThan(portraitWidth);

  await page.getByTestId('header-text').fill('Confidential');
  await expect(page.getByTestId('preview-page').first()).toContainText('Confidential');
});

test('exports a DOCX whose content matches the document', async ({ page }) => {
  await page.locator('.monaco-editor').first().click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a');
  await page.keyboard.type('# Export Check\n\nUnique paragraph for export.');
  await expect(page.getByTestId('preview')).toContainText('Export Check');

  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-button').click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('document.docx');
  const data = await downloadBuffer(download);
  // DOCX files are ZIP archives: PK magic bytes and non-trivial size.
  expect(data.length).toBeGreaterThan(1000);
  expect(data[0]).toBe(0x50);
  expect(data[1]).toBe(0x4b);

  const zip = await JSZip.loadAsync(data);
  const documentXml = await zip.file('word/document.xml')!.async('string');
  expect(documentXml).toContain('Export Check');
  expect(documentXml).toContain('Unique paragraph for export.');
});

test('exports a PDF with the correct header bytes', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-pdf-button').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);

  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const bytes = Buffer.concat(chunks);
  expect(bytes.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  expect(bytes.length).toBeGreaterThan(1000);
});

test('document title feeds metadata and export filename', async ({ page }) => {
  await page.getByTestId('settings-toggle').click();
  await page.getByTestId('doc-title').fill('My Report');

  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-button').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('My Report.docx');

  const zip = await JSZip.loadAsync(await downloadBuffer(download));
  const coreXml = await zip.file('docProps/core.xml')!.async('string');
  expect(coreXml).toContain('My Report');
});

test('new document clears the editor and content persists across reload', async ({ page }) => {
  await page.getByRole('button', { name: 'New document' }).click();
  await expect(page.getByTestId('word-count')).toHaveText('0 words · 0 lines · 0 chars');

  await page.locator('.monaco-editor').first().click();
  await page.keyboard.type('# Persisted Title');
  await expect(page.getByTestId('preview')).toContainText('Persisted Title');

  await page.reload();
  await expect(page.getByTestId('preview')).toContainText('Persisted Title');
});

test('dark mode toggles the color scheme', async ({ page }) => {
  const html = page.locator('html');
  await expect(html).not.toHaveClass(/dark/);
  await page.getByTestId('dark-mode-toggle').click();
  await expect(html).toHaveClass(/dark/);
});

test('open markdown file via file input', async ({ page }) => {
  await page.getByTestId('file-input').setInputFiles({
    name: 'uploaded.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('# Uploaded Document\n\nFrom a file.'),
  });
  await expect(page.getByTestId('preview')).toContainText('Uploaded Document');
});

test('remote images render as placeholders without network fetch', async ({ page }) => {
  let remoteImageRequest = false;
  await page.route('**/*', async (route) => {
    if (route.request().url().includes('example.com')) {
      remoteImageRequest = true;
    }
    await route.continue();
  });

  await page.locator('.monaco-editor').first().click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a');
  await page.keyboard.type('![Remote diagram](https://example.com/diagram.png)');

  await expect(page.getByTestId('preview')).toContainText('[Remote diagram]');
  await expect(page.locator('[data-preview="image-placeholder"]')).toBeVisible();
  await expect(page.locator('[data-preview="image"] img')).toHaveCount(0);
  expect(remoteImageRequest).toBe(false);
});

test('syntax highlighting colors code tokens in preview', async ({ page }) => {
  await page.locator('.monaco-editor').first().click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a');
  await page.keyboard.type('```typescript\nconst answer = 42;\n```');

  const code = page.locator('[data-preview="code"]');
  await expect(code).toBeVisible();
  const colors = await code.locator('span').evaluateAll((spans) =>
    [...new Set(spans.map((span) => getComputedStyle(span).color))],
  );
  expect(colors.length).toBeGreaterThan(1);
});

test('preview zoom controls scale the document pages', async ({ page }) => {
  const scaler = page.getByTestId('preview-scaler');
  const before = await scaler.evaluate((el) => getComputedStyle(el).transform);

  await page.getByTestId('preview-zoom-in').click();
  await expect(page.getByTestId('preview-zoom-level')).toHaveText('125%');
  await expect
    .poll(async () => scaler.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe(before);
});

test('print preview hides the editor and shows full-width preview', async ({ page }) => {
  await expect(page.getByTestId('editor')).toBeVisible();
  await page.getByTestId('print-preview-toggle').click();
  await expect(page.getByTestId('editor')).toHaveCount(0);
  await expect(page.getByTestId('preview')).toHaveAttribute('data-print-preview', 'true');
  await page.getByTestId('print-preview-toggle').click();
  await expect(page.getByTestId('editor')).toBeVisible();
});

test('fullscreen editing hides the preview pane', async ({ page }) => {
  await expect(page.getByTestId('preview')).toBeVisible();
  await page.getByTestId('editor-fullscreen-toggle').click();
  await expect(page.getByTestId('preview')).toHaveCount(0);
  await expect(page.getByTestId('editor')).toBeVisible();
  await page.getByTestId('editor-fullscreen-toggle').click();
  await expect(page.getByTestId('preview')).toBeVisible();
});

test('refresh preview re-renders without changing markdown', async ({ page }) => {
  await expect(page.getByTestId('preview')).toContainText('Welcome to Seamdoc');
  await page.getByTestId('preview-refresh').click();
  await expect(page.getByTestId('preview')).toContainText('Welcome to Seamdoc');
  await expect(page.getByTestId('preview-page').first()).toBeVisible();
});

test('editor find and replace open Monaco widgets', async ({ page }) => {
  await page.locator('.monaco-editor').first().click();
  const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

  await page.getByTestId('editor-find').click();
  await expect(page.locator('.monaco-editor .find-widget')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByTestId('editor-replace').click();
  await expect(page.locator('.monaco-editor .find-widget')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.keyboard.press(`${mod}+f`);
  await expect(page.locator('.monaco-editor .find-widget')).toBeVisible();
});

test('app settings panel toggles preferences', async ({ page }) => {
  await page.getByTestId('app-settings-toggle').click();
  await expect(page.getByTestId('app-settings-panel')).toBeVisible();

  await page.getByTestId('default-export-format').selectOption('pdf');
  await expect(page.getByTestId('export-pdf-button')).toHaveClass(/bg-blue-600/);

  await page.getByTestId('pref-high-contrast').check();
  await expect(page.locator('html')).toHaveClass(/high-contrast/);
});

test('document metadata fields are editable', async ({ page }) => {
  await page.getByTestId('settings-toggle').click();
  await page.getByTestId('doc-description').fill('Quarterly report');
  await page.getByTestId('doc-keywords').fill('seamdoc, export');
  await page.getByTestId('doc-language').fill('en-US');
  await expect(page.getByTestId('doc-description')).toHaveValue('Quarterly report');
});

test('invalid drag-and-drop shows an error message', async ({ page }) => {
  const dataTransfer = await page.evaluateHandle(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['not markdown'], 'notes.txt', { type: 'text/plain' }));
    return transfer;
  });
  await page.getByTestId('app-drop-zone').dispatchEvent('drop', { dataTransfer });
  await expect(page.getByTestId('drag-drop-error')).toContainText('Markdown');
});

test('preview scroll syncs when the preview pane is scrolled', async ({ page }) => {
  const longBody = Array.from({ length: 80 }, (_, index) => `Paragraph ${index + 1}.`).join('\n\n');
  await page.locator('.monaco-editor').first().click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a');
  await page.keyboard.type(`# Scroll Sync\n\n${longBody}`);

  const preview = page.getByTestId('preview');
  await expect(preview).toContainText('Paragraph 80');

  const before = await preview.evaluate((el) => el.scrollTop);
  await preview.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect
    .poll(async () => preview.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(before);
});
