import { describe, it, expect } from 'vitest';
import { pptxExporter } from './index.js';
import { RENDER_TREE_VERSION } from '@seamdoc/shared';
import type { RenderDocument } from '@seamdoc/renderer';

describe('PptxExporter', () => {
  it('supports pptx format', () => {
    expect(pptxExporter.supports('pptx')).toBe(true);
    expect(pptxExporter.supports('docx')).toBe(false);
  });

  it('exports mock render document to pptx arraybuffer', async () => {
    const doc: RenderDocument = {
      version: RENDER_TREE_VERSION,
      metadata: {
        title: 'Presentation Doc',
        author: 'Jane Doe',
        description: 'Mock PPTX description',
        keywords: [],
        language: 'en',
        createdAt: '',
        updatedAt: '',
      },
      pages: [
        {
          id: '1',
          width: 720,
          height: 540,
          margins: { top: 36, right: 36, bottom: 36, left: 36 },
          border: null,
          header: null,
          footer: null,
          children: [
            {
              type: 'heading',
              id: 'h1',
              runs: [
                {
                  text: 'Slide Title',
                  style: {
                    fontFamily: 'Calibri',
                    fontSize: 24,
                    fontWeight: 700,
                    italic: false,
                    color: '#FF0000',
                    underline: false,
                    code: false,
                    link: '',
                  },
                },
              ],
              alignment: 'center',
              level: 1,
              spacing: { before: 10, after: 10 },
              bounds: { x: 36, y: 36, width: 648, height: 40 },
            },
          ],
        },
      ],
    };

    const result = await pptxExporter.export(doc, {
      filename: 'pres',
      metadata: doc.metadata,
    });

    expect(result.filename).toBe('pres.pptx');
    expect(result.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    );
    expect(result.data).toBeInstanceOf(ArrayBuffer);
    expect(result.data.byteLength).toBeGreaterThan(0);
  });
});
