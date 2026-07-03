import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('exports the active theme as JSON', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('theme-export-button').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/-theme\.json$/);

  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const theme = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(theme.schemaVersion).toBe(1);
  expect(theme.metadata.id).toBeTruthy();
  expect(theme.headings.h1).toBeTruthy();
});

test('imports a valid theme JSON and selects it', async ({ page }) => {
  // Round-trip: export the active theme, rename it, and import it back.
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('theme-export-button').click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const theme = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  theme.metadata.id = 'my-custom-theme';
  theme.metadata.name = 'My Custom Theme';

  await page.getByTestId('theme-file-input').setInputFiles({
    name: 'my-custom-theme.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(theme)),
  });

  const select = page.getByTestId('theme-select');
  await expect(select).toHaveValue('my-custom-theme');
  await expect(select.locator('option[value="my-custom-theme"]')).toHaveText(
    'My Custom Theme (imported)',
  );

  // The imported theme survives a reload (persisted locally).
  await page.reload();
  await expect(page.getByTestId('theme-select')).toHaveValue('my-custom-theme');
});

test('rejects an invalid theme file with a visible error', async ({ page }) => {
  await page.getByTestId('theme-file-input').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"not": "a theme"}'),
  });
  await expect(page.getByTestId('theme-error')).toContainText('Invalid theme');

  await page.getByTestId('theme-file-input').setInputFiles({
    name: 'not-json.json',
    mimeType: 'application/json',
    buffer: Buffer.from('this is not json'),
  });
  await expect(page.getByTestId('theme-error')).toContainText('not valid JSON');
});
