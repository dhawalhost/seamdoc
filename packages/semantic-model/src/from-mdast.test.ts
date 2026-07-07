import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '@seamdoc/parser';
import { fromMdast } from './from-mdast.js';
import { validateDocument } from './validate.js';
import type { SdmHeading, SdmList, SdmParagraph, SdmQuote, SdmTable } from './nodes.js';

function toSdm(markdown: string) {
  return fromMdast(parseMarkdown(markdown));
}

describe('fromMdast', () => {
  it('converts headings with levels', () => {
    const doc = toSdm('## Section');
    const heading = doc.children[0] as SdmHeading;
    expect(heading.type).toBe('heading');
    expect(heading.level).toBe(2);
    expect(heading.children).toEqual([{ type: 'text', value: 'Section' }]);
  });

  it('converts inline formatting', () => {
    const doc = toSdm('Some *italic* and **bold** and `code` and [link](https://example.com).');
    const paragraph = doc.children[0] as SdmParagraph;
    const types = paragraph.children.map((node) => node.type);
    expect(types).toContain('emphasis');
    expect(types).toContain('strong');
    expect(types).toContain('inlineCode');
    expect(types).toContain('link');
  });

  it('converts fenced code blocks with language', () => {
    const doc = toSdm('```python\nprint("hi")\n```');
    expect(doc.children[0]).toEqual({
      type: 'code',
      language: 'python',
      value: 'print("hi")',
    });
  });

  it('converts block quotes with nested blocks', () => {
    const doc = toSdm('> quoted text');
    const quote = doc.children[0] as SdmQuote;
    expect(quote.type).toBe('quote');
    expect(quote.children[0]?.type).toBe('paragraph');
  });

  it('converts ordered and unordered lists', () => {
    const ordered = toSdm('1. one\n2. two').children[0] as SdmList;
    const unordered = toSdm('- a\n- b').children[0] as SdmList;
    expect(ordered.ordered).toBe(true);
    expect(ordered.items).toHaveLength(2);
    expect(unordered.ordered).toBe(false);
  });

  it('converts tables with header, alignment, and body rows', () => {
    const doc = toSdm('| Name | Age |\n| :--- | ---: |\n| Ada | 36 |');
    const table = doc.children[0] as SdmTable;
    expect(table.header?.cells).toHaveLength(2);
    expect(table.alignments).toEqual(['left', 'right']);
    expect(table.rows).toHaveLength(1);
  });

  it('converts images and thematic breaks', () => {
    const doc = toSdm('![alt text](image.png)\n\n---');
    const paragraph = doc.children[0] as SdmParagraph;
    expect(paragraph.children[0]).toEqual({
      type: 'image',
      src: 'image.png',
      alt: 'alt text',
      title: null,
    });
    expect(doc.children[1]?.type).toBe('thematicBreak');
  });

  it('is JSON-serializable and deterministic', () => {
    const markdown = '# T\n\ntext with **bold**\n';
    const a = toSdm(markdown);
    const b = toSdm(markdown);
    expect(JSON.parse(JSON.stringify(a))).toEqual(b);
  });

  it('produces documents that pass validation', () => {
    const doc = toSdm('# Valid\n\nbody');
    expect(validateDocument(doc).valid).toBe(true);
  });

  it('converts markdown form elements to SdmInput nodes', () => {
    const doc = toSdm('Check: [ ] Done: [x] Text: [______]');
    const paragraph = doc.children[0] as SdmParagraph;
    expect(paragraph.children).toHaveLength(6);
    expect(paragraph.children[0]).toEqual({ type: 'text', value: 'Check: ' });
    expect(paragraph.children[1]).toEqual({
      type: 'input',
      inputType: 'checkbox',
      name: 'input_1',
      checked: false,
    });
    expect(paragraph.children[2]).toEqual({ type: 'text', value: ' Done: ' });
    expect(paragraph.children[3]).toEqual({
      type: 'input',
      inputType: 'checkbox',
      name: 'input_2',
      checked: true,
    });
    expect(paragraph.children[4]).toEqual({ type: 'text', value: ' Text: ' });
    expect(paragraph.children[5]).toEqual({
      type: 'input',
      inputType: 'text',
      name: 'input_3',
      width: 6,
    });
  });

  it('converts HTML pagebreak comments to SdmPageBreak nodes', () => {
    const doc = toSdm('Before\n\n<!-- pagebreak -->\n\nAfter');
    expect(doc.children).toHaveLength(3);
    expect(doc.children[0]?.type).toBe('paragraph');
    expect(doc.children[1]?.type).toBe('pageBreak');
    expect(doc.children[2]?.type).toBe('paragraph');
  });
});

