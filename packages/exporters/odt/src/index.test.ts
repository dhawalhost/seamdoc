import { describe, it, expect } from 'vitest';
import { odtExporter } from './index.js';
import { RENDER_TREE_VERSION } from '@seamdoc/shared';
import type { RenderDocument } from '@seamdoc/renderer';

const mockDoc: RenderDocument = {
  version: RENDER_TREE_VERSION,
  metadata: {
    title: 'ODT Test',
    author: 'SeamDoc',
    description: 'Test document',
    keywords: [],
    language: 'en',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  pages: [
    {
      id: 'p1',
      width: 595,
      height: 842,
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
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
              text: 'Hello ODT World',
              style: {
                fontFamily: 'Arial',
                fontSize: 20,
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
          bounds: { x: 72, y: 72, width: 451, height: 28 },
        },
        {
          type: 'paragraph',
          id: 'para1',
          runs: [
            {
              text: 'This is a test paragraph.',
              style: {
                fontFamily: 'Arial',
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
          lineHeight: 1.2,
          spacing: { before: 0, after: 10 },
          bounds: { x: 72, y: 112, width: 451, height: 16 },
        },
      ],
    },
  ],
};

describe('OdtExporter', () => {
  it('supports odt format only', () => {
    expect(odtExporter.supports('odt')).toBe(true);
    expect(odtExporter.supports('pdf')).toBe(false);
    expect(odtExporter.supports('docx')).toBe(false);
  });

  it('exports a valid ODT ArrayBuffer', async () => {
    const result = await odtExporter.export(mockDoc, {
      filename: 'test-doc',
      metadata: mockDoc.metadata,
    });

    expect(result.filename).toBe('test-doc.odt');
    expect(result.mimeType).toBe('application/vnd.oasis.opendocument.text');
    expect(result.data).toBeInstanceOf(ArrayBuffer);
    expect(result.data.byteLength).toBeGreaterThan(100);
  });

  it('output is a ZIP starting with PK magic bytes', async () => {
    const result = await odtExporter.export(mockDoc, {
      filename: 'document',
      metadata: mockDoc.metadata,
    });
    const bytes = new Uint8Array(result.data);
    // ZIP local file header signature: PK\x03\x04
    expect(bytes[0]).toBe(0x50); // P
    expect(bytes[1]).toBe(0x4b); // K
  });

  it('content XML contains heading and paragraph text', async () => {
    const { unzipSync } = await import('fflate');
    const result = await odtExporter.export(mockDoc, {
      filename: 'content-test',
      metadata: mockDoc.metadata,
    });
    const unzipped = unzipSync(new Uint8Array(result.data));
    const contentEntry = unzipped['content.xml'];
    expect(contentEntry).toBeDefined();
    const contentXml = new TextDecoder().decode(contentEntry);
    expect(contentXml).toContain('Hello ODT World');
    expect(contentXml).toContain('This is a test paragraph.');
    expect(contentXml).toContain('Heading_1');
  });

  it('preserves .odt extension if already present', async () => {
    const result = await odtExporter.export(mockDoc, {
      filename: 'already.odt',
      metadata: mockDoc.metadata,
    });
    expect(result.filename).toBe('already.odt');
  });
});
