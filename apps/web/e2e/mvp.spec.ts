/**
 * MVP end-to-end workflow (docs/01-product/prd.md success criteria):
 * open the app, write or upload Markdown, view a live preview, pick a theme,
 * adjust settings, and download a correct DOCX.
 */

import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/');
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

test('exports a DOCX download', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-button').click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('document.docx');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const data = Buffer.concat(chunks);
  // DOCX files are ZIP archives: PK magic bytes and non-trivial size.
  expect(data.length).toBeGreaterThan(1000);
  expect(data[0]).toBe(0x50);
  expect(data[1]).toBe(0x4b);
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
