/**
 * Layout engine (docs/02-architecture/layout-engine.md).
 *
 * Transforms a semantic document plus theme and settings into a fully
 * positioned Render Tree: resolve styles → measure → paginate → position →
 * build. Stateless and deterministic; all units are points.
 */

import type { DocumentSettings, PageDimensions } from '@seamdoc/types';
import { PAGE_SIZES, RENDER_TREE_VERSION } from '@seamdoc/shared';
import { createIdGenerator, type IdGenerator } from '@seamdoc/utils';
import type {
  SdmBlock,
  SdmDocument,
  SdmInline,
  SdmList,
  SdmQuote,
  SdmTable,
  SdmTableRow,
} from '@seamdoc/semantic-model';
import type { Theme } from '@seamdoc/themes';
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

export function layoutDocument(input: LayoutInput): RenderDocument {
  const { document, settings } = input;
  const theme = applySettingsOverrides(input.theme, settings);
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
  });

  return {
    version: RENDER_TREE_VERSION,
    metadata: document.metadata,
    pages,
  };
}

function resolvePageSize(settings: DocumentSettings): PageDimensions {
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
  return { ...block, bounds: { ...block.bounds, x, y } };
}

function buildPage(children: readonly RenderBlock[], ctx: PaginationContext): RenderPage {
  return {
    id: ctx.ids.next('page'),
    width: ctx.pageSize.width,
    height: ctx.pageSize.height,
    margins: ctx.settings.margins,
    header: buildHeaderFooter(ctx.settings.header, false, ctx),
    footer: buildHeaderFooter(ctx.settings.footer, ctx.settings.pageNumbers, ctx),
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
      const lines = block.value === '' ? [] : block.value.split('\n');
      return [
        {
          type: 'codeBlock',
          id: ids.next('code'),
          language: block.language ?? '',
          lines,
          style: {
            fontFamily: theme.code.fontFamily,
            fontSize: theme.code.fontSize,
            fontWeight: 400,
            italic: false,
            color: theme.code.color,
            underline: false,
            code: true,
            link: '',
          },
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
    case 'list':
      return [buildList(block, theme, width, ids, indent)];
    case 'table':
      return [buildTable(block, theme, width, ids)];
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
