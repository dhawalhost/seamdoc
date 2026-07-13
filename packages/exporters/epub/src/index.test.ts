import { describe, it, expect } from 'vitest';
import { epubExporter } from './index.js';
import { RENDER_TREE_VERSION } from '@seamdoc/shared';
import type { RenderDocument } from '@seamdoc/renderer';

const mockDoc: RenderDocument = {
  version: RENDER_TREE_VERSION,
  metadata: {
    title: 'EPUB Test Book',
    author: 'SeamDoc Author',
    description: 'Test EPUB description',
    keywords: [],
    language: 'en',
    createdAt: '2026-07-09T00:00:00Z',
    updatedAt: '2026-07-09T00:00:00Z',
  },
  pages: [
    {
      id: 'p1',
      width: 600,
      height: 800,
      margins: { top: 50, right: 50, bottom: 50, left: 50 },
      border: null,
      header: null,
      footer: null,
      children: [
        {
          type: 'heading',
          id: 'h1',
          level: 1,
          runs: [
            {
              text: 'Chapter 1: The Beginning',
              style: {
                fontFamily: 'Inter',
                fontSize: 24,
                fontWeight: 700,
                italic: false,
                color: '#000000',
                underline: false,
                code: false,
                link: '',
              },
            },
          ],
          alignment: 'left',
          spacing: { before: 12, after: 6 },
          bounds: { x: 50, y: 50, width: 500, height: 30 },
        },
        {
          type: 'paragraph',
          id: 'para1',
          runs: [
            {
              text: 'Once upon a time in a digital landscape...',
              style: {
                fontFamily: 'Inter',
                fontSize: 12,
                fontWeight: 400,
                italic: false,
                color: '#333333',
                underline: false,
                code: false,
                link: '',
              },
            },
          ],
          alignment: 'left',
          lineHeight: 1.5,
          spacing: { before: 0, after: 10 },
          bounds: { x: 50, y: 100, width: 500, height: 20 },
        },
      ],
    },
  ],
};

describe('EpubExporter', () => {
  it('supports epub format only', () => {
    expect(epubExporter.supports('epub')).toBe(true);
    expect(epubExporter.supports('pdf')).toBe(false);
  });

  it('exports a valid EPUB ArrayBuffer structure', async () => {
    const result = await epubExporter.export(mockDoc, {
      filename: 'my-book',
      metadata: mockDoc.metadata,
    });

    expect(result.filename).toBe('my-book.epub');
    expect(result.mimeType).toBe('application/epub+zip');
    expect(result.data).toBeInstanceOf(ArrayBuffer);
    expect(result.data.byteLength).toBeGreaterThan(500);

    const bytes = new Uint8Array(result.data);
    expect(bytes[0]).toBe(0x50); // P
    expect(bytes[1]).toBe(0x4b); // K
  });

  it('contains required EPUB entries when unzipped', async () => {
    const { unzipSync } = await import('fflate');
    const result = await epubExporter.export(mockDoc, {
      filename: 'book',
      metadata: mockDoc.metadata,
    });

    const unzipped = unzipSync(new Uint8Array(result.data));

    // mimetype entry (mandatory)
    expect(unzipped['mimetype']).toBeDefined();
    const mimeText = new TextDecoder().decode(unzipped['mimetype']);
    expect(mimeText).toBe('application/epub+zip');

    // container.xml
    expect(unzipped['META-INF/container.xml']).toBeDefined();

    // content.opf
    expect(unzipped['OEBPS/content.opf']).toBeDefined();
    const opfText = new TextDecoder().decode(unzipped['OEBPS/content.opf']);
    expect(opfText).toContain('EPUB Test Book');
    expect(opfText).toContain('SeamDoc Author');
    expect(opfText).toContain('page-1.xhtml');

    // toc.xhtml
    expect(unzipped['OEBPS/toc.xhtml']).toBeDefined();

    // page-1.xhtml
    expect(unzipped['OEBPS/page-1.xhtml']).toBeDefined();
    const pageText = new TextDecoder().decode(unzipped['OEBPS/page-1.xhtml']);
    expect(pageText).toContain('Chapter 1: The Beginning');
    expect(pageText).toContain('Once upon a time');
  });

  it('preserves .epub extension if already present', async () => {
    const result = await epubExporter.export(mockDoc, {
      filename: 'existing.epub',
      metadata: mockDoc.metadata,
    });
    expect(result.filename).toBe('existing.epub');
  });
});
