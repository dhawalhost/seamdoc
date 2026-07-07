import { describe, it, expect } from 'vitest';
import { htmlExporter } from './index.js';
import { RENDER_TREE_VERSION } from '@seamdoc/shared';
import type { RenderDocument } from '@seamdoc/renderer';

describe('HtmlExporter', () => {
  it('supports html format', () => {
    expect(htmlExporter.supports('html')).toBe(true);
    expect(htmlExporter.supports('docx')).toBe(false);
  });

  it('exports a valid render tree document', async () => {
    const doc: RenderDocument = {
      version: RENDER_TREE_VERSION,
      metadata: {
        title: 'Test Doc',
        author: 'John Doe',
        description: 'Test Description',
        keywords: [],
        language: 'en',
        createdAt: '',
        updatedAt: '',
      },
      pages: [
        {
          id: '1',
          width: 612,
          height: 792,
          margins: { top: 72, right: 72, bottom: 72, left: 72 },
          border: null,
          header: {
            text: 'Test Header',
            style: {
              fontFamily: 'Arial',
              fontSize: 10,
              fontWeight: 400,
              italic: false,
              color: '#000000',
              underline: false,
              code: false,
              link: '',
            },
            pageNumbers: false,
          },
          footer: {
            text: 'Test Footer',
            style: {
              fontFamily: 'Arial',
              fontSize: 10,
              fontWeight: 400,
              italic: false,
              color: '#000000',
              underline: false,
              code: false,
              link: '',
            },
            pageNumbers: true,
          },
          children: [
            {
              type: 'paragraph',
              id: 'p1',
              runs: [
                {
                  text: 'Hello World',
                  style: {
                    fontFamily: 'Arial',
                    fontSize: 12,
                    fontWeight: 400,
                    italic: false,
                    color: '#000000',
                    underline: false,
                    code: false,
                    link: '',
                  },
                },
              ],
              alignment: 'left',
              spacing: { before: 0, after: 10 },
              lineHeight: 1.15,
              bounds: { x: 72, y: 72, width: 468, height: 20 },
            },
          ],
        },
      ],
    };

    const result = await htmlExporter.export(doc, {
      filename: 'test',
      metadata: doc.metadata,
    });

    expect(result.filename).toBe('test.html');
    expect(result.mimeType).toBe('text/html');

    const htmlString = new TextDecoder().decode(result.data);
    expect(htmlString).toContain('<!DOCTYPE html>');
    expect(htmlString).toContain('Test Doc');
    expect(htmlString).toContain('John Doe');
    expect(htmlString).toContain('Test Header');
    expect(htmlString).toContain('Test Footer');
    expect(htmlString).toContain('Hello World');
    expect(htmlString).toContain('width: 612pt');
    expect(htmlString).toContain('min-height: 792pt');
  });
});
