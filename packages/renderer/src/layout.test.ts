import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '@seamdoc/parser';
import { fromMdast } from '@seamdoc/semantic-model';
import { DEFAULT_DOCUMENT_SETTINGS, PAGE_SIZES, RENDER_TREE_VERSION } from '@seamdoc/shared';
import { minimalTheme } from '@seamdoc/themes';
import { layoutDocument } from './layout.js';
import type { RenderHeading, RenderList, RenderParagraph, RenderTable } from './render-tree.js';

function layout(markdown: string, settings = DEFAULT_DOCUMENT_SETTINGS) {
  const document = fromMdast(parseMarkdown(markdown));
  return layoutDocument({ document, theme: minimalTheme, settings });
}

describe('layoutDocument', () => {
  it('produces a versioned render tree with at least one page', () => {
    const tree = layout('# Hello');
    expect(tree.version).toBe(RENDER_TREE_VERSION);
    expect(tree.pages).toHaveLength(1);
    expect(tree.pages[0]?.width).toBeCloseTo(PAGE_SIZES.A4.width);
  });

  it('resolves heading styles from the theme', () => {
    const tree = layout('# Title');
    const heading = tree.pages[0]?.children[0] as RenderHeading;
    expect(heading.type).toBe('heading');
    expect(heading.runs[0]?.style.fontSize).toBe(minimalTheme.headings.h1.fontSize);
    expect(heading.runs[0]?.style.color).toBe(minimalTheme.headings.h1.color);
  });

  it('flattens inline formatting into styled runs', () => {
    const tree = layout('plain **bold** *italic* [link](https://example.com)');
    const paragraph = tree.pages[0]?.children[0] as RenderParagraph;
    const [plain, bold, , italic, , link] = paragraph.runs;
    expect(plain?.style.fontWeight).toBe(400);
    expect(bold?.style.fontWeight).toBe(700);
    expect(italic?.style.italic).toBe(true);
    expect(link?.style.link).toBe('https://example.com');
    expect(link?.style.underline).toBe(true);
  });

  it('assigns positions and stable ids to blocks', () => {
    const tree = layout('# One\n\ntwo\n\nthree');
    const blocks = tree.pages[0]?.children ?? [];
    expect(blocks.map((block) => block.id)).toEqual(['heading-1', 'paragraph-1', 'paragraph-2']);
    const ys = blocks.map((block) => block.bounds.y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });

  it('paginates content that exceeds one page', () => {
    const paragraphs = Array.from({ length: 200 }, (_, i) => `Paragraph number ${i}.`).join('\n\n');
    const tree = layout(paragraphs);
    expect(tree.pages.length).toBeGreaterThan(1);
  });

  it('honors landscape orientation', () => {
    const tree = layout('text', { ...DEFAULT_DOCUMENT_SETTINGS, orientation: 'landscape' });
    const page = tree.pages[0]!;
    expect(page.width).toBeGreaterThan(page.height);
  });

  it('builds header and footer nodes from settings', () => {
    const tree = layout('text', {
      ...DEFAULT_DOCUMENT_SETTINGS,
      header: 'Confidential',
      footer: 'Acme Corp',
      pageNumbers: true,
    });
    const page = tree.pages[0]!;
    expect(page.header?.text).toBe('Confidential');
    expect(page.footer?.text).toBe('Acme Corp');
    expect(page.footer?.pageNumbers).toBe(true);
  });

  it('renders lists with markers and nesting depth', () => {
    const tree = layout('1. first\n2. second');
    const list = tree.pages[0]?.children[0] as RenderList;
    expect(list.ordered).toBe(true);
    expect(list.items.map((item) => item.marker)).toEqual(['1.', '2.']);
  });

  it('distributes table column widths evenly', () => {
    const tree = layout('| a | b |\n| - | - |\n| 1 | 2 |');
    const table = tree.pages[0]?.children[0] as RenderTable;
    expect(table.columnWidths).toHaveLength(2);
    expect(table.columnWidths[0]).toBeCloseTo(table.columnWidths[1]!);
    expect(table.rows[0]?.header).toBe(true);
  });

  it('is deterministic for identical input', () => {
    const markdown = '# Doc\n\nBody with **bold**.\n\n- item\n';
    expect(layout(markdown)).toEqual(layout(markdown));
  });
});
