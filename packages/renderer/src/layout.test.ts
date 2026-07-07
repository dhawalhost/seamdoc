import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '@seamdoc/parser';
import { fromMdast } from '@seamdoc/semantic-model';
import { DEFAULT_DOCUMENT_SETTINGS, PAGE_SIZES, RENDER_TREE_VERSION } from '@seamdoc/shared';
import { minimalTheme } from '@seamdoc/themes';
import { layoutDocument } from './layout.js';
import type {
  RenderCodeBlock,
  RenderHeading,
  RenderList,
  RenderParagraph,
  RenderTable,
  RenderColumns,
} from './render-tree.js';


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

  it('applies document typography overrides on top of the theme', () => {
    const tree = layout('body text', {
      ...DEFAULT_DOCUMENT_SETTINGS,
      fontFamily: 'Georgia',
      fontSize: 14,
      lineSpacing: 2,
      paragraphSpacing: 20,
    });
    const paragraph = tree.pages[0]?.children[0] as RenderParagraph;
    expect(paragraph.runs[0]?.style.fontFamily).toBe('Georgia');
    expect(paragraph.runs[0]?.style.fontSize).toBe(14);
    expect(paragraph.lineHeight).toBe(2);
    expect(paragraph.spacing.after).toBe(20);
  });

  it('applies Shiki token colors to fenced code blocks', () => {
    const tree = layout('```typescript\nconst answer = 42;\n```');
    const code = tree.pages[0]?.children[0] as RenderCodeBlock;
    expect(code.type).toBe('codeBlock');
    const colors = new Set(code.lines.flat().map((run) => run.style.color));
    expect(colors.size).toBeGreaterThan(1);
  });

  it('is deterministic for identical input', () => {
    const markdown = '# Doc\n\nBody with **bold**.\n\n- item\n';
    expect(layout(markdown)).toEqual(layout(markdown));
  });

  it('honors custom page sizes', () => {
    const tree = layoutDocument({
      document: fromMdast(parseMarkdown('text')),
      theme: minimalTheme,
      settings: {
        ...DEFAULT_DOCUMENT_SETTINGS,
        customPageSize: { width: 500, height: 600 },
      },
    });
    const page = tree.pages[0]!;
    expect(page.width).toBe(500);
    expect(page.height).toBe(600);
  });

  it('binds page borders to page children', () => {
    const border = { color: '#00FF00', width: 2, style: 'dashed' as const };
    const tree = layoutDocument({
      document: fromMdast(parseMarkdown('text')),
      theme: minimalTheme,
      settings: {
        ...DEFAULT_DOCUMENT_SETTINGS,
        pageBorder: border,
      },
    });
    const page = tree.pages[0]!;
    expect(page.border).toEqual(border);
  });

  it('positions columns side-by-side', () => {
    const columnsDoc = {
      type: 'document' as const,
      version: 1,
      metadata: {
        title: '',
        author: '',
        description: '',
        keywords: [],
        language: 'en',
        createdAt: '',
        updatedAt: '',
      },
      children: [
        {
          type: 'columns' as const,
          children: [
            {
              type: 'column' as const,
              children: [
                {
                  type: 'paragraph' as const,
                  children: [{ type: 'text' as const, value: 'Left Column' }],
                },
              ],
            },
            {
              type: 'column' as const,
              children: [
                {
                  type: 'paragraph' as const,
                  children: [{ type: 'text' as const, value: 'Right Column' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const tree = layoutDocument({
      document: columnsDoc,
      theme: minimalTheme,
      settings: DEFAULT_DOCUMENT_SETTINGS,
    });

    const columnsBlock = tree.pages[0]?.children[0];
    expect(columnsBlock?.type).toBe('columns');

    const cols = (columnsBlock as RenderColumns).columns;

    expect(cols).toHaveLength(2);
    const col0 = cols[0];
    const col1 = cols[1];
    expect(col0).toBeDefined();
    expect(col1).toBeDefined();
    const firstBlock0 = col0?.children[0];
    const firstBlock1 = col1?.children[0];
    expect(firstBlock0).toBeDefined();
    expect(firstBlock1).toBeDefined();
    expect(firstBlock0?.bounds.x).toBe(DEFAULT_DOCUMENT_SETTINGS.margins.left);
    expect(firstBlock1?.bounds.x).toBeGreaterThan(DEFAULT_DOCUMENT_SETTINGS.margins.left);
  });
});

