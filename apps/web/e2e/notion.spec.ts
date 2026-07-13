import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('imports document from Notion block JSON correctly', async ({ page }) => {
  // Click the Notion import button in toolbar
  await page.getByTestId('notion-import-toggle').click();

  // Verify modal is open
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#notion-import-title')).toContainText('Import from Notion');

  // Input some Notion blocks JSON
  const notionJson = JSON.stringify(
    [
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Notion Document Heading' },
              plain_text: 'Notion Document Heading',
            },
          ],
        },
      },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Paragraph imported from Notion block JSON.' },
              plain_text: 'Paragraph imported from Notion block JSON.',
            },
          ],
        },
      },
    ],
    null,
    2,
  );

  await page.getByTestId('notion-import-textarea').fill(notionJson);
  await page.getByRole('button', { name: 'Import', exact: true }).click();

  // Verify modal closes
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Verify preview is updated with the content
  await expect(page.getByTestId('preview')).toContainText('Notion Document Heading');
  await expect(page.getByTestId('preview')).toContainText(
    'Paragraph imported from Notion block JSON.',
  );
});
