/**
 * RenderBlock → ODT XML serializers.
 * Each block type maps to one or more ODT <text:*> or <table:*> elements.
 */

import type { RenderBlock, TextRun } from '@seamdoc/renderer';
import { escapeXml } from './xml.js';

function serializeRuns(runs: readonly TextRun[]): string {
  return runs
    .map((run) => {
      const text = escapeXml(run.text);
      const isBold = run.style.fontWeight >= 700;
      const isItalic = run.style.italic;
      const isUnderline = run.style.underline || run.style.link !== '';
      const isCode = run.style.code;

      if (!isBold && !isItalic && !isUnderline && !isCode) {
        return `<text:span>${text}</text:span>`;
      }

      let styleName = '';
      if (isCode) styleName = 'InlineCode';
      else if (isBold && isItalic) styleName = 'Bold';
      else if (isBold) styleName = 'Bold';
      else if (isItalic) styleName = 'Italic';
      else if (isUnderline) styleName = 'Underline';

      return `<text:span text:style-name="${styleName}">${text}</text:span>`;
    })
    .join('');
}

function serializeBlock(block: RenderBlock): string {
  switch (block.type) {
    case 'heading': {
      const level = Math.min(block.level, 6);
      const styleName = `Heading_${level}`;
      return `      <text:h text:style-name="${styleName}" text:outline-level="${level}">${serializeRuns(block.runs)}</text:h>`;
    }
    case 'paragraph':
      return `      <text:p text:style-name="Standard">${serializeRuns(block.runs)}</text:p>`;
    case 'codeBlock': {
      const lines = block.lines
        .map((line) => {
          const text = escapeXml(line.map((r) => r.text).join(''));
          return `      <text:p text:style-name="Code">${text}</text:p>`;
        })
        .join('\n');
      return lines;
    }
    case 'quote': {
      const children = block.children.map(serializeBlock).join('\n');
      return `      <text:p text:style-name="Quotations">${children}</text:p>`;
    }
    case 'list': {
      const items = block.items
        .map((item) => {
          const content = item.children.map(serializeBlock).join('\n');
          return `        <text:list-item>\n${content}\n        </text:list-item>`;
        })
        .join('\n');
      return `      <text:list>\n${items}\n      </text:list>`;
    }
    case 'table': {
      const rows = block.rows
        .map((row) => {
          const cells = row.cells
            .map(
              (cell) =>
                `          <table:table-cell><text:p>${serializeRuns(cell.runs)}</text:p></table:table-cell>`,
            )
            .join('\n');
          return `        <table:table-row>\n${cells}\n        </table:table-row>`;
        })
        .join('\n');
      const colCount = block.columnWidths.length || 1;
      const cols = Array.from({ length: colCount }, () => `        <table:table-column/>`).join(
        '\n',
      );
      return `      <table:table>\n${cols}\n${rows}\n      </table:table>`;
    }
    case 'image': {
      const alt = escapeXml(block.alt || 'image');
      return `      <text:p text:style-name="Standard">[${alt}]</text:p>`;
    }
    case 'rule':
      return `      <text:p text:style-name="Standard">─────────────────────────────────────</text:p>`;
    case 'columns': {
      return block.columns.map((col) => col.children.map(serializeBlock).join('\n')).join('\n');
    }
    case 'pageBreak':
      return '';
    default: {
      const exhaustive: never = block;
      throw new Error(`Unhandled ODT block: ${JSON.stringify(exhaustive)}`);
    }

  }
}

/** Serializes all page blocks to ODT body XML. */
export function serializeDocument(
  pages: ReadonlyArray<{ children: readonly RenderBlock[] }>,
): string {
  return pages.flatMap((page) => page.children.map(serializeBlock)).join('\n');
}
