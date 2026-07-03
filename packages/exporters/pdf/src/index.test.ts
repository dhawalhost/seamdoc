import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '@seamdoc/core';
import { DEFAULT_DOCUMENT_METADATA, DEFAULT_DOCUMENT_SETTINGS } from '@seamdoc/shared';
import type { ExportSettings } from '@seamdoc/types';
import { PdfExporter, pdfExporter } from './index.js';

const MARKDOWN = `# Report Title

A paragraph with **bold**, _italic_, \`inline code\`, and a [link](https://example.com).

> A block quote with some text.

- First bullet
- Second bullet

1. Ordered one
2. Ordered two

| Name | Value |
| ---- | ----- |
| Rows | 2     |

\`\`\`ts
const x = 1;
\`\`\`

![Diagram](https://example.com/diagram.png)

---

Closing paragraph with special chars: café — “quotes” • ✓
`;

const settings: ExportSettings = {
  filename: 'report',
  metadata: { ...DEFAULT_DOCUMENT_METADATA, title: 'Report Title', author: 'Tester' },
};

function render(markdown: string = MARKDOWN) {
  return renderMarkdown(markdown, {
    theme: 'minimal',
    settings: DEFAULT_DOCUMENT_SETTINGS,
  }).renderDocument;
}

describe('PdfExporter', () => {
  it('declares pdf support only', () => {
    expect(pdfExporter.supports('pdf')).toBe(true);
    expect(pdfExporter.supports('docx')).toBe(false);
  });

  it('exports a valid PDF covering every block type', async () => {
    const result = await pdfExporter.export(render(), settings);
    expect(result.filename).toBe('report.pdf');
    expect(result.mimeType).toBe('application/pdf');
    const header = new TextDecoder().decode(result.data.slice(0, 5));
    expect(header).toBe('%PDF-');
    expect(result.data.byteLength).toBeGreaterThan(1000);
  });

  it('embeds document metadata', async () => {
    const result = await pdfExporter.export(render(), settings);
    const text = new TextDecoder('latin1').decode(result.data);
    // PDF info strings are UTF-16BE hex literals; "Seamdoc" as producer.
    expect(text).toContain('<FEFF005300650061006D0064006F0063>');
    // "Report Title" as title.
    expect(text).toContain(
      '<FEFF005200650070006F007200740020005400690074006C0065>',
    );
  });

  it('produces one PDF page per render page', async () => {
    const longMarkdown = Array.from({ length: 120 }, (_, i) => `Paragraph ${i}.\n`).join('\n');
    const renderDocument = render(longMarkdown);
    expect(renderDocument.pages.length).toBeGreaterThan(1);
    const result = await pdfExporter.export(renderDocument, settings);
    const text = new TextDecoder('latin1').decode(result.data);
    const pageCount = (text.match(/\/Type \/Page[^s]/g) ?? []).length;
    expect(pageCount).toBe(renderDocument.pages.length);
  });

  it('is deterministic for identical input', async () => {
    const first = await pdfExporter.export(render(), settings);
    const second = await pdfExporter.export(render(), settings);
    expect(Buffer.from(first.data).equals(Buffer.from(second.data))).toBe(true);
  });

  it('rejects unsupported render tree versions and empty documents', async () => {
    const doc = render();
    await expect(
      new PdfExporter().export({ ...doc, version: 999 }, settings),
    ).rejects.toThrow('Unsupported render tree version');
    await expect(new PdfExporter().export({ ...doc, pages: [] }, settings)).rejects.toThrow(
      'no pages',
    );
  });
});
