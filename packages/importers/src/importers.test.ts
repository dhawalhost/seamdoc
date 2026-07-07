import { describe, it, expect } from 'vitest';
import { importHtml } from './html.js';
import { importNotion } from './notion.js';
import { importMdx } from './mdx.js';
import { importAsciidoc } from './asciidoc.js';

describe('Universal Importers', () => {
  describe('HTML Importer', () => {
    it('imports HTML headers and paragraphs into SDM', () => {
      const html = '<h1>Title</h1><p>Hello <strong>World</strong></p>';
      const sdm = importHtml(html);

      expect(sdm.children).toHaveLength(2);
      expect(sdm.children[0]).toEqual({
        type: 'heading',
        level: 1,
        children: [{ type: 'text', value: 'Title' }],
      });
      expect(sdm.children[1]!.type).toBe('paragraph');
    });
  });

  describe('Notion JSON Importer', () => {
    it('imports Notion block list into SDM', () => {
      const blocks = [
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [{ plain_text: 'Notion Text', annotations: {} }],
          },
        },
      ];
      const sdm = importNotion(blocks);

      expect(sdm.children).toHaveLength(1);
      expect(sdm.children[0]).toEqual({
        type: 'paragraph',
        children: [{ type: 'text', value: 'Notion Text' }],
      });
    });
  });

  describe('MDX Importer', () => {
    it('pre-processes JSX components and maps Callouts to Quotes', () => {
      const mdx = '<Callout>Info details</Callout>\n\n# Header';
      const sdm = importMdx(mdx);

      expect(sdm.children).toHaveLength(2);
      expect(sdm.children[0]!.type).toBe('quote');
      expect(sdm.children[1]).toEqual({
        type: 'heading',
        level: 1,
        children: [{ type: 'text', value: 'Header' }],
      });
    });
  });

  describe('AsciiDoc Importer', () => {
    it('imports AsciiDoc elements into SDM', () => {
      const doc = '== Title H2\n\nThis is a *bold* paragraph.\n\n----\nconst a = 1;\n----';
      const sdm = importAsciidoc(doc);

      expect(sdm.children).toHaveLength(3);
      expect(sdm.children[0]).toEqual({
        type: 'heading',
        level: 2,
        children: [{ type: 'text', value: 'Title H2' }],
      });
      expect(sdm.children[1]!.type).toBe('paragraph');
      expect(sdm.children[2]).toEqual({
        type: 'code',
        language: null,
        value: 'const a = 1;',
      });
    });
  });
});
