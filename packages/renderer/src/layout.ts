/**
 * Layout engine (docs/02-architecture/layout-engine.md).
 *
 * Transforms a semantic document plus theme and settings into a fully
 * positioned Render Tree: resolve styles → measure → paginate → position →
 * build. Stateless and deterministic; all units are points.
 */

import type { DocumentSettings, PageDimensions } from '@seamdoc/types';
import { PAGE_SIZES, RENDER_TREE_VERSION, BRAND_PACKS } from '@seamdoc/shared';
import { createIdGenerator, type IdGenerator } from '@seamdoc/utils';
import type {
  SdmBlock,
  SdmDocument,
  SdmInline,
  SdmList,
  SdmQuote,
  SdmTable,
  SdmTableRow,
  SdmHeading,
  SdmListItem,
  // SdmColumns,
} from '@seamdoc/semantic-model';
import type { Theme } from '@seamdoc/themes';
import { highlightCodeToLines } from '@seamdoc/highlighter';
import { estimateParagraphHeight } from './measure.js';
import type {
  Bounds,
  RenderBlock,
  RenderDocument,
  RenderHeaderFooter,
  RenderListItem,
  RenderPage,
  RenderTableRow,
} from './render-tree.js';
import { baseRunStyle, headingRunStyle, resolveInlines } from './style-resolver.js';

export interface LayoutInput {
  readonly document: SdmDocument;
  readonly theme: Theme;
  readonly settings: DocumentSettings;
}

/**
 * Applies brand pack styling overrides (colors and typography) to the active theme.
 */
function applyBrandPackOverrides(
  theme: Theme,
  settings: DocumentSettings,
): { theme: Theme; logoUrl: string | null; watermarkUrl: string | null } {
  let logoUrl: string | null = null;
  let watermarkUrl: string | null = null;
  const overriddenTheme = { ...theme };

  if (settings.activeBrandPackId) {
    const brand = BRAND_PACKS.find((b) => b.id === settings.activeBrandPackId);
    if (brand) {
      overriddenTheme.colors = {
        ...overriddenTheme.colors,
        primary: brand.primaryColor,
        accent: brand.secondaryColor,
      };

      if (settings.fontFamily === null && brand.fontFamilies.length > 0) {
        const brandFont = brand.fontFamilies[0];
        if (brandFont) {
          overriddenTheme.typography = {
            ...overriddenTheme.typography,
            body: brandFont,
            heading: brandFont,
          };
          overriddenTheme.paragraph = {
            ...overriddenTheme.paragraph,
            fontFamily: brandFont,
          };
          overriddenTheme.headings = {
            h1: { ...overriddenTheme.headings.h1, fontFamily: brandFont },
            h2: { ...overriddenTheme.headings.h2, fontFamily: brandFont },
            h3: { ...overriddenTheme.headings.h3, fontFamily: brandFont },
            h4: { ...overriddenTheme.headings.h4, fontFamily: brandFont },
            h5: { ...overriddenTheme.headings.h5, fontFamily: brandFont },
            h6: { ...overriddenTheme.headings.h6, fontFamily: brandFont },
          };
        }
      }

      logoUrl = brand.logoUrl ?? null;
      watermarkUrl = brand.watermarkUrl ?? null;
    }
  }

  return { theme: overriddenTheme, logoUrl, watermarkUrl };
}

/**
 * Applies document-level typography overrides on top of the active theme,
 * following the resolution order in docs/02-architecture/theme-engine.md
 * (base theme → user overrides → final style).
 */
function applySettingsOverrides(theme: Theme, settings: DocumentSettings): Theme {
  const { fontFamily, fontSize, lineSpacing, paragraphSpacing } = settings;
  if (
    fontFamily === null &&
    fontSize === null &&
    lineSpacing === null &&
    paragraphSpacing === null
  ) {
    return theme;
  }
  return {
    ...theme,
    paragraph: {
      ...theme.paragraph,
      fontFamily: fontFamily ?? theme.paragraph.fontFamily,
      fontSize: fontSize ?? theme.paragraph.fontSize,
      lineHeight: lineSpacing ?? theme.paragraph.lineHeight,
      spacing:
        paragraphSpacing === null
          ? theme.paragraph.spacing
          : { ...theme.paragraph.spacing, after: paragraphSpacing },
    },
  };
}

function preprocessDocument(document: SdmDocument): SdmDocument {
  const headings = document.children.filter((c): c is SdmHeading => c.type === 'heading');

  const processedChildren = document.children.map((child): SdmBlock => {
    if (child.type === 'toc') {
      const items: SdmListItem[] = headings
        .filter((h) => h.level <= 3)
        .map((h) => {
          const depthPrefix = '    '.repeat(h.level - 1);
          const textRuns = h.children;
          return {
            type: 'listItem' as const,
            children: [
              {
                type: 'paragraph' as const,
                children: [{ type: 'text' as const, value: depthPrefix }, ...textRuns],
              },
            ],
          };
        });

      return {
        type: 'list' as const,
        ordered: false,
        items,
      };
    }
    return child;
  });

  // Footnote definition collection and extraction
  const footnoteDefs = new Map<string, SdmBlock[]>();
  const bodyBlocks: SdmBlock[] = [];

  for (const block of processedChildren) {
    if (block.type === 'footnoteDef') {
      footnoteDefs.set(block.identifier, [...block.children]);
    } else {
      bodyBlocks.push(block);
    }
  }

  const refsOrder: string[] = [];

  function mapInlineFootnotes(inline: SdmInline): SdmInline {
    if (inline.type === 'footnoteRef') {
      let idx = refsOrder.indexOf(inline.identifier);
      if (idx === -1) {
        refsOrder.push(inline.identifier);
        idx = refsOrder.length - 1;
      }
      const num = idx + 1;
      return {
        type: 'text',
        value: `[${num}]`,
      };
    }
    if ('children' in inline && inline.children !== undefined) {
      return {
        ...inline,
        children: inline.children.map(mapInlineFootnotes),
      } as SdmInline;
    }
    return inline;
  }

  function mapBlockFootnotes(block: SdmBlock): SdmBlock {
    switch (block.type) {
      case 'paragraph':
      case 'heading':
        return {
          ...block,
          children: block.children.map(mapInlineFootnotes),
        } as SdmBlock;
      case 'quote':
        return {
          ...block,
          children: block.children.map(mapBlockFootnotes),
        };
      case 'list':
        return {
          ...block,
          items: block.items.map((item) => ({
            ...item,
            children: item.children.map(mapBlockFootnotes),
          })),
        };
      case 'table':
        return {
          ...block,
          header: block.header
            ? {
                ...block.header,
                cells: block.header.cells.map((c) => ({
                  ...c,
                  children: c.children.map(mapInlineFootnotes),
                })),
              }
            : null,
          rows: block.rows.map((row) => ({
            ...row,
            cells: row.cells.map((c) => ({
              ...c,
              children: c.children.map(mapInlineFootnotes),
            })),
          })),
        };
      case 'columns':
        return {
          ...block,
          children: block.children.map((col) => ({
            ...col,
            children: col.children.map(mapBlockFootnotes),
          })),
        };
      default:
        return block;
    }
  }

  const mappedBodyBlocks = bodyBlocks.map(mapBlockFootnotes);

  if (refsOrder.length > 0) {
    const listItems: SdmListItem[] = refsOrder.map((id, index) => {
      const defBlocks = footnoteDefs.get(id) || [
        {
          type: 'paragraph' as const,
          children: [{ type: 'text' as const, value: 'Footnote definition missing.' }],
        },
      ];

      const num = index + 1;
      const firstBlock = defBlocks[0];
      const formattedBlocks = [...defBlocks];

      if (firstBlock && firstBlock.type === 'paragraph') {
        formattedBlocks[0] = {
          ...firstBlock,
          children: [{ type: 'text' as const, value: `[${num}] ` }, ...firstBlock.children],
        };
      } else {
        formattedBlocks.unshift({
          type: 'paragraph' as const,
          children: [{ type: 'text' as const, value: `[${num}] ` }],
        });
      }

      return {
        type: 'listItem' as const,
        children: formattedBlocks,
      };
    });

    mappedBodyBlocks.push({
      type: 'thematicBreak' as const,
    });

    mappedBodyBlocks.push({
      type: 'list' as const,
      ordered: false,
      items: listItems,
    });
  }

  const coverBlocks: SdmBlock[] = [];
  if (document.metadata?.coverPage) {
    coverBlocks.push({
      type: 'heading' as const,
      level: 1,
      children: [{ type: 'text' as const, value: document.metadata.title || 'Untitled' }],
    });
    coverBlocks.push({
      type: 'paragraph' as const,
      children: [{ type: 'text' as const, value: '' }],
    });
    if (document.metadata.description) {
      coverBlocks.push({
        type: 'paragraph' as const,
        children: [{ type: 'text' as const, value: document.metadata.description }],
      });
    }
    const authorLine = document.metadata.author ? `By ${document.metadata.author}` : '';
    if (authorLine) {
      coverBlocks.push({
        type: 'paragraph' as const,
        children: [{ type: 'text' as const, value: authorLine }],
      });
    }
    if (document.metadata.disclaimer) {
      coverBlocks.push({
        type: 'paragraph' as const,
        children: [{ type: 'text' as const, value: document.metadata.disclaimer }],
      });
    }
    coverBlocks.push({
      type: 'pageBreak' as const,
    });
  }

  return {
    ...document,
    children: [...coverBlocks, ...mappedBodyBlocks],
  };
}

export function layoutDocument(input: LayoutInput): RenderDocument {
  const document = preprocessDocument(input.document);
  const { settings } = input;
  const {
    theme: brandTheme,
    logoUrl,
    watermarkUrl,
  } = applyBrandPackOverrides(input.theme, settings);
  const theme = applySettingsOverrides(brandTheme, settings);
  const pageSize = resolvePageSize(settings);
  const contentWidth = pageSize.width - settings.margins.left - settings.margins.right;
  const contentHeight = pageSize.height - settings.margins.top - settings.margins.bottom;
  const ids = createIdGenerator();

  const blocks = document.children.flatMap((block) =>
    buildBlock(block, theme, contentWidth, ids, 0),
  );

  const pages = paginate(blocks, {
    pageSize,
    contentHeight,
    settings,
    theme,
    ids,
    logoUrl,
    watermarkUrl,
  });

  return {
    version: RENDER_TREE_VERSION,
    metadata: document.metadata,
    pages,
  };
}

function resolvePageSize(settings: DocumentSettings): PageDimensions {
  if (settings.customPageSize) {
    return settings.customPageSize;
  }
  const base = PAGE_SIZES[settings.pageSize];
  if (settings.orientation === 'landscape') {
    return { width: base.height, height: base.width };
  }
  return base;
}

interface PaginationContext {
  readonly pageSize: PageDimensions;
  readonly contentHeight: number;
  readonly settings: DocumentSettings;
  readonly theme: Theme;
  readonly ids: IdGenerator;
  readonly logoUrl: string | null;
  readonly watermarkUrl: string | null;
}

function paginate(blocks: readonly RenderBlock[], ctx: PaginationContext): readonly RenderPage[] {
  const pages: RenderPage[] = [];
  let current: RenderBlock[] = [];
  let cursorY = ctx.settings.margins.top;

  const flush = (): void => {
    pages.push(buildPage(current, ctx));
    current = [];
    cursorY = ctx.settings.margins.top;
  };

  for (const block of blocks) {
    if (block.type === 'pageBreak') {
      flush();
      continue;
    }
    const blockHeight = block.bounds.height + spacingOf(block);
    const fits = cursorY + blockHeight <= ctx.settings.margins.top + ctx.contentHeight;
    if (!fits && current.length > 0) {
      flush();
    }
    const positioned = repositionBlock(block, ctx.settings.margins.left, cursorY);
    current.push(positioned);
    cursorY += blockHeight;
  }

  if (current.length > 0 || pages.length === 0) {
    flush();
  }

  return pages;
}

function spacingOf(block: RenderBlock): number {
  if (block.type === 'table') {
    return 0;
  }
  return block.spacing.before + block.spacing.after;
}

function repositionBlock(block: RenderBlock, x: number, y: number): RenderBlock {
  if (block.type === 'columns') {
    const repositionedCols = block.columns.map((col) => {
      const colChildren = col.children.map((child) => {
        return repositionBlock(child, x + child.bounds.x, y + child.bounds.y);
      });
      return { ...col, children: colChildren };
    });
    return { ...block, columns: repositionedCols, bounds: { ...block.bounds, x, y } };
  }
  return { ...block, bounds: { ...block.bounds, x, y } };
}

function buildPage(children: readonly RenderBlock[], ctx: PaginationContext): RenderPage {
  return {
    id: ctx.ids.next('page'),
    width: ctx.pageSize.width,
    height: ctx.pageSize.height,
    margins: ctx.settings.margins,
    border: ctx.settings.pageBorder || null,
    header: buildHeaderFooter(ctx.settings.header, false, ctx),
    footer: buildHeaderFooter(ctx.settings.footer, ctx.settings.pageNumbers, ctx),
    watermark: ctx.watermarkUrl,
    logo: ctx.logoUrl,
    children,
  };
}

function buildHeaderFooter(
  text: string,
  pageNumbers: boolean,
  ctx: PaginationContext,
): RenderHeaderFooter | null {
  if (text === '' && !pageNumbers) {
    return null;
  }
  return {
    text,
    style: {
      ...baseRunStyle(ctx.theme),
      fontSize: Math.max(8, ctx.theme.paragraph.fontSize - 2),
      color: ctx.theme.colors.text,
    },
    pageNumbers,
  };
}

function buildBlock(
  block: SdmBlock,
  theme: Theme,
  width: number,
  ids: IdGenerator,
  indent: number,
): readonly RenderBlock[] {
  switch (block.type) {
    case 'heading': {
      const style = headingRunStyle(theme, block.level);
      const heading = theme.headings[`h${block.level}`];
      const runs = resolveInlines(block.children, theme, style);
      return [
        {
          type: 'heading',
          id: ids.next('heading'),
          level: block.level,
          runs,
          alignment: heading.alignment,
          spacing: heading.spacing,
          bounds: bounds(width, estimateParagraphHeight(runs, width, heading.fontSize, 1.2)),
        },
      ];
    }
    case 'paragraph': {
      const runs = resolveInlines(block.children, theme, baseRunStyle(theme));
      const image = extractBlockImage(block.children);
      if (image !== null) {
        return [
          {
            type: 'image',
            id: ids.next('image'),
            src: image.src,
            alt: image.alt,
            alignment: theme.image.alignment,
            spacing: theme.image.spacing,
            bounds: bounds(Math.min(width, theme.image.maxWidth), 150),
          },
        ];
      }
      return [
        {
          type: 'paragraph',
          id: ids.next('paragraph'),
          runs,
          alignment: theme.paragraph.alignment,
          spacing: theme.paragraph.spacing,
          lineHeight: theme.paragraph.lineHeight,
          bounds: bounds(
            width,
            estimateParagraphHeight(
              runs,
              width,
              theme.paragraph.fontSize,
              theme.paragraph.lineHeight,
            ),
          ),
        },
      ];
    }
    case 'code': {
      const baseStyle = {
        fontFamily: theme.code.fontFamily,
        fontSize: theme.code.fontSize,
        fontWeight: 400,
        italic: false,
        color: theme.code.color,
        underline: false,
        code: true,
        link: '',
      };
      const highlighted = highlightCodeToLines(block.value, block.language ?? '', theme.code.color);
      const lines = highlighted.map((tokens) =>
        tokens.map((token) => ({
          text: token.text,
          style: {
            ...baseStyle,
            color: token.color,
            italic: token.italic,
            fontWeight: token.bold ? 700 : baseStyle.fontWeight,
          },
        })),
      );
      return [
        {
          type: 'codeBlock',
          id: ids.next('code'),
          language: block.language ?? '',
          lines,
          style: baseStyle,
          background: theme.code.background,
          padding: theme.code.padding,
          spacing: theme.code.spacing,
          bounds: bounds(width, lines.length * theme.code.fontSize * 1.4 + theme.code.padding * 2),
        },
      ];
    }
    case 'quote':
      return [buildQuote(block, theme, width, ids, indent)];
    case 'thematicBreak':
      return [
        {
          type: 'rule',
          id: ids.next('rule'),
          color: theme.horizontalRule.color,
          thickness: theme.horizontalRule.thickness,
          spacing: theme.horizontalRule.spacing,
          bounds: bounds(width, theme.horizontalRule.thickness),
        },
      ];
    case 'pageBreak':
      return [
        {
          type: 'pageBreak',
          id: ids.next('pagebreak'),
          bounds: bounds(width, 0),
          spacing: { before: 0, after: 0 },
        },
      ];
    case 'list':
      return [buildList(block, theme, width, ids, indent)];
    case 'table':
      return [buildTable(block, theme, width, ids)];
    case 'columns': {
      const gap = 12;
      const colCount = block.children.length;
      if (colCount === 0) {
        return [];
      }
      const colWidth = (width - gap * (colCount - 1)) / colCount;

      const columns = block.children.map((col) => {
        const children = col.children.flatMap((child) =>
          buildBlock(child, theme, colWidth, ids, indent),
        );
        return {
          id: ids.next('column'),
          children,
          width: colWidth,
        };
      });

      const colHeights = columns.map((col) =>
        col.children.reduce((sum, child) => sum + child.bounds.height + spacingOf(child), 0),
      );
      const height = Math.max(...colHeights, 0);

      const positionedColumns = columns.map((col, colIndex) => {
        const startX = colIndex * (colWidth + gap);
        let currentY = 0;
        const colChildren = col.children.map((child) => {
          const childHeight = child.bounds.height + spacingOf(child);
          const pos = repositionBlock(child, startX, currentY);
          currentY += childHeight;
          return pos;
        });
        return {
          ...col,
          children: colChildren,
        };
      });

      return [
        {
          type: 'columns',
          id: ids.next('columns'),
          columns: positionedColumns,
          spacing: { before: 12, after: 12 },
          bounds: bounds(width, height),
        },
      ];
    }
    case 'toc':
      return [];
    case 'footnoteDef':
      return [];
    default: {
      const exhaustive: never = block;
      throw new Error(`Unhandled block node: ${JSON.stringify(exhaustive)}`);
    }
  }
}

/** A paragraph whose only child is an image renders as a block-level image. */
function extractBlockImage(children: readonly SdmInline[]): { src: string; alt: string } | null {
  const only = children.length === 1 ? children[0] : undefined;
  if (only !== undefined && only.type === 'image') {
    return { src: only.src, alt: only.alt };
  }
  return null;
}

function buildQuote(
  block: SdmQuote,
  theme: Theme,
  width: number,
  ids: IdGenerator,
  indent: number,
): RenderBlock {
  const innerWidth = width - theme.quote.indent;
  const children = block.children.flatMap((child) =>
    buildBlock(child, theme, innerWidth, ids, indent + 1),
  );
  const height = children.reduce((sum, child) => sum + child.bounds.height, 0);
  return {
    type: 'quote',
    id: ids.next('quote'),
    children: theme.quote.italic ? children.map(italicizeBlock) : children,
    borderColor: theme.quote.borderColor,
    borderWidth: theme.quote.borderWidth,
    indent: theme.quote.indent,
    spacing: theme.quote.spacing,
    bounds: bounds(width, height),
  };
}

function italicizeBlock(block: RenderBlock): RenderBlock {
  if (block.type === 'paragraph' || block.type === 'heading') {
    return {
      ...block,
      runs: block.runs.map((run) => ({ ...run, style: { ...run.style, italic: true } })),
    };
  }
  return block;
}

function buildList(
  block: SdmList,
  theme: Theme,
  width: number,
  ids: IdGenerator,
  depth: number,
): RenderBlock {
  const innerWidth = width - theme.list.indent;
  const items: RenderListItem[] = block.items.map((item, index) => ({
    id: ids.next('list-item'),
    marker: block.ordered ? `${index + 1}.` : '•',
    depth,
    children: item.children.flatMap((child) =>
      buildBlock(child, theme, innerWidth, ids, depth + 1),
    ),
  }));
  const height = items.reduce(
    (sum, item) => sum + item.children.reduce((inner, child) => inner + child.bounds.height, 0),
    0,
  );
  return {
    type: 'list',
    id: ids.next('list'),
    ordered: block.ordered,
    indent: theme.list.indent,
    items,
    spacing: theme.list.spacing,
    bounds: bounds(width, height),
  };
}

function buildTable(block: SdmTable, theme: Theme, width: number, ids: IdGenerator): RenderBlock {
  const columnCount = Math.max(
    block.header?.cells.length ?? 0,
    ...block.rows.map((row) => row.cells.length),
    1,
  );
  const columnWidth = width / columnCount;
  const columnWidths = Array.from({ length: columnCount }, () => columnWidth);

  const rows: RenderTableRow[] = [];
  if (block.header !== null) {
    rows.push(buildTableRow(block, block.header, true, theme, ids));
  }
  for (const row of block.rows) {
    rows.push(buildTableRow(block, row, false, theme, ids));
  }

  const rowHeight = theme.paragraph.fontSize * 1.5 + theme.table.cellPadding * 2;
  return {
    type: 'table',
    id: ids.next('table'),
    rows,
    columnWidths,
    borderColor: theme.table.borderColor,
    borderWidth: theme.table.borderWidth,
    cellPadding: theme.table.cellPadding,
    bounds: bounds(width, rows.length * rowHeight),
  };
}

function buildTableRow(
  table: SdmTable,
  row: SdmTableRow,
  header: boolean,
  theme: Theme,
  ids: IdGenerator,
): RenderTableRow {
  return {
    id: ids.next('row'),
    header,
    cells: row.cells.map((cell, index) => {
      const alignment = table.alignments[index] ?? 'none';
      const style = header
        ? {
            ...baseRunStyle(theme),
            fontWeight: theme.table.headerFontWeight,
            color: theme.table.headerColor,
          }
        : baseRunStyle(theme);
      return {
        id: ids.next('cell'),
        runs: resolveInlines(cell.children, theme, style),
        alignment: alignment === 'none' ? 'left' : alignment,
        background: header ? theme.table.headerBackground : '',
      };
    }),
  };
}

function bounds(width: number, height: number): Bounds {
  return { x: 0, y: 0, width, height: Math.max(height, 0) };
}
