/**
 * Render-block drawing for the PDF exporter. Top-level blocks arrive with
 * absolute page positions from the layout engine; nested children (quote and
 * list contents) are flowed locally with a cursor.
 */

import { rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import type {
  RenderAlignment,
  RenderBlock,
  RenderCodeBlock,
  RenderHeaderFooter,
  RenderImage,
  RenderList,
  RenderPage,
  RenderQuote,
  RenderRule,
  RenderTable,
  RunStyle,
  TextRun,
} from '@seamdoc/renderer';
import type { FontRegistry } from './fonts.js';
import { sanitizeText } from './fonts.js';

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

function parseHex(color: string): Rgb {
  const hex = color.replace('#', '');
  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255,
  };
}

function toColor(hex: string) {
  const { r, g, b } = parseHex(hex);
  return rgb(r, g, b);
}

interface LineSegment {
  readonly text: string;
  readonly style: RunStyle;
  readonly font: PDFFont;
  readonly width: number;
  readonly input?: {
    readonly inputType: 'checkbox' | 'text';
    readonly name: string;
    readonly checked?: boolean;
    readonly width?: number;
  };
}

interface Line {
  readonly segments: readonly LineSegment[];
  readonly width: number;
}

/** Greedy word-wrap of styled runs into lines that fit maxWidth. */
async function breakLines(
  runs: readonly TextRun[],
  maxWidth: number,
  fonts: FontRegistry,
): Promise<Line[]> {
  const lines: Line[] = [];
  let segments: LineSegment[] = [];
  let lineWidth = 0;

  const pushLine = () => {
    lines.push({ segments, width: lineWidth });
    segments = [];
    lineWidth = 0;
  };

  for (const run of runs) {
    const font = await fonts.fontFor(run.style);
    if (run.input !== undefined) {
      const width = font.widthOfTextAtSize(run.text, run.style.fontSize);
      if (lineWidth + width > maxWidth && lineWidth > 0) {
        pushLine();
      }
      segments.push({
        text: run.text,
        style: run.style,
        font,
        width,
        input: run.input,
      });
      lineWidth += width;
      continue;
    }

    // Split while keeping separators so spacing is preserved.
    const isCustom = fonts.isCustomFont(run.style);
    const textToProcess = isCustom ? run.text : sanitizeText(run.text);
    const words = textToProcess.split(/(\s+)/).filter((word) => word !== '');
    for (const word of words) {
      const width = font.widthOfTextAtSize(word, run.style.fontSize);
      if (lineWidth + width > maxWidth && lineWidth > 0 && word.trim() !== '') {
        pushLine();
      }
      // Drop leading whitespace on fresh lines.
      if (lineWidth === 0 && word.trim() === '') {
        continue;
      }
      segments.push({ text: word, style: run.style, font, width });
      lineWidth += width;
    }
  }

  if (segments.length > 0) {
    pushLine();
  }
  return lines;
}

function alignmentOffset(alignment: RenderAlignment, maxWidth: number, lineWidth: number): number {
  switch (alignment) {
    case 'center':
      return (maxWidth - lineWidth) / 2;
    case 'right':
      return maxWidth - lineWidth;
    case 'left':
    case 'justify':
      return 0;
    default: {
      const exhaustive: never = alignment;
      throw new Error(`Unhandled alignment: ${String(exhaustive)}`);
    }
  }
}

export class PageRenderer {
  constructor(
    private readonly page: PDFPage,
    private readonly pageSpec: RenderPage,
    private readonly fonts: FontRegistry,
    private readonly pageNumber: number,
  ) {}

  /** Converts a top-based y coordinate into PDF's bottom-based space. */
  private pdfY(topY: number): number {
    return this.pageSpec.height - topY;
  }

  async drawPage(): Promise<void> {
    if (this.pageSpec.border !== null) {
      const borderWidth = this.pageSpec.border.width;
      this.page.drawRectangle({
        x: borderWidth / 2,
        y: borderWidth / 2,
        width: this.pageSpec.width - borderWidth,
        height: this.pageSpec.height - borderWidth,
        borderColor: toColor(this.pageSpec.border.color),
        borderWidth: borderWidth,
      });
    }
    if (this.pageSpec.header !== null) {
      await this.drawHeaderFooter(this.pageSpec.header, 'header');
    }
    if (this.pageSpec.footer !== null) {
      await this.drawHeaderFooter(this.pageSpec.footer, 'footer');
    }
    for (const block of this.pageSpec.children) {
      await this.drawBlock(block, block.bounds.x, block.bounds.y, block.bounds.width);
    }
  }

  private async drawHeaderFooter(
    config: RenderHeaderFooter,
    position: 'header' | 'footer',
  ): Promise<void> {
    const pieces: string[] = [];
    if (config.text !== '') {
      pieces.push(config.text);
    }
    if (config.pageNumbers) {
      pieces.push(String(this.pageNumber));
    }
    if (pieces.length === 0) {
      return;
    }
    const font = await this.fonts.fontFor(config.style);
    const isCustom = this.fonts.isCustomFont(config.style);
    const text = isCustom ? pieces.join('  ') : sanitizeText(pieces.join('  '));
    const width = font.widthOfTextAtSize(text, config.style.fontSize);
    const x = (this.pageSpec.width - width) / 2;
    const y =
      position === 'header'
        ? this.pdfY(this.pageSpec.margins.top / 2)
        : this.pageSpec.margins.bottom / 2;
    this.page.drawText(text, {
      x,
      y,
      size: config.style.fontSize,
      font,
      color: toColor(config.style.color),
    });
  }

  /** Draws a block at (x, topY); returns the vertical space consumed. */
  private async drawBlock(
    block: RenderBlock,
    x: number,
    topY: number,
    width: number,
  ): Promise<number> {
    switch (block.type) {
      case 'heading':
        return this.drawRuns(block.runs, x, topY, width, block.alignment, 1.2);
      case 'paragraph':
        return this.drawRuns(block.runs, x, topY, width, block.alignment, block.lineHeight);
      case 'codeBlock':
        return this.drawCode(block, x, topY, width);
      case 'quote':
        return this.drawQuote(block, x, topY, width);
      case 'list':
        return this.drawList(block, x, topY, width);
      case 'table':
        return this.drawTable(block, x, topY, width);
      case 'image':
        return this.drawImagePlaceholder(block, x, topY, width);
      case 'rule':
        return this.drawRule(block, x, topY, width);
      case 'columns':
        for (const col of block.columns) {
          for (const child of col.children) {
            await this.drawBlock(child, child.bounds.x, child.bounds.y, child.bounds.width);
          }
        }
        return block.bounds.height;
      case 'pageBreak':
        return 0;
      default: {
        const exhaustive: never = block;
        throw new Error(`Unhandled render block: ${String(exhaustive)}`);
      }
    }
  }

  private async drawRuns(
    runs: readonly TextRun[],
    x: number,
    topY: number,
    width: number,
    alignment: RenderAlignment,
    lineHeight: number,
  ): Promise<number> {
    const lines = await breakLines(runs, width, this.fonts);

    let cursorY = topY;
    for (const line of lines) {
      const fontSize = line.segments[0]?.style.fontSize ?? 12;
      const advance = fontSize * lineHeight;
      let cursorX = x + alignmentOffset(alignment, width, line.width);
      const baseline = this.pdfY(cursorY + fontSize);
      for (const segment of line.segments) {
        if (segment.input !== undefined) {
          const input = segment.input;
          const form = this.page.doc.getForm();
          const fieldY = baseline;
          const fieldH = segment.style.fontSize;
          const fieldW = segment.width;

          try {
            if (input.inputType === 'checkbox') {
              const checkBox = form.createCheckBox(input.name);
              checkBox.addToPage(this.page, {
                x: cursorX,
                y: fieldY,
                width: fieldH, // checkboxes are square
                height: fieldH,
              });
              if (input.checked) {
                checkBox.check();
              }
            } else {
              const textField = form.createTextField(input.name);
              textField.addToPage(this.page, {
                x: cursorX,
                y: fieldY,
                width: fieldW,
                height: fieldH,
              });
              textField.setFontSize(segment.style.fontSize);
            }
          } catch {
            // Ignore if field with the same name was already created (e.g. multi-page layout retry)
          }
        } else {
          this.page.drawText(segment.text, {
            x: cursorX,
            y: baseline,
            size: segment.style.fontSize,
            font: segment.font,
            color: toColor(segment.style.color),
          });
          if (segment.style.underline || segment.style.link !== '') {
            this.page.drawLine({
              start: { x: cursorX, y: baseline - 1.5 },
              end: { x: cursorX + segment.width, y: baseline - 1.5 },
              thickness: 0.6,
              color: toColor(segment.style.color),
            });
          }
        }
        cursorX += segment.width;
      }
      cursorY += advance;
    }
    return cursorY - topY;
  }

  private async drawCode(
    block: RenderCodeBlock,
    x: number,
    topY: number,
    width: number,
  ): Promise<number> {
    const lineAdvance = block.style.fontSize * 1.4;
    const height = block.lines.length * lineAdvance + block.padding * 2;
    this.page.drawRectangle({
      x,
      y: this.pdfY(topY + height),
      width,
      height,
      color: toColor(block.background),
    });
    let cursorY = topY + block.padding;
    for (const lineRuns of block.lines) {
      let cursorX = x + block.padding;
      const baseline = this.pdfY(cursorY + block.style.fontSize);
      for (const run of lineRuns) {
        const font = await this.fonts.fontFor(run.style);
        const isCustom = this.fonts.isCustomFont(run.style);
        const text = isCustom ? run.text : sanitizeText(run.text);
        this.page.drawText(text, {
          x: cursorX,
          y: baseline,
          size: run.style.fontSize,
          font,
          color: toColor(run.style.color),
        });
        cursorX += font.widthOfTextAtSize(text, run.style.fontSize);
      }
      cursorY += lineAdvance;
    }
    return height;
  }

  private async drawQuote(
    block: RenderQuote,
    x: number,
    topY: number,
    width: number,
  ): Promise<number> {
    let cursorY = topY;
    for (const child of block.children) {
      cursorY += await this.drawBlock(child, x + block.indent, cursorY, width - block.indent);
    }
    const height = Math.max(cursorY - topY, block.bounds.height);
    this.page.drawRectangle({
      x,
      y: this.pdfY(topY + height),
      width: block.borderWidth,
      height,
      color: toColor(block.borderColor),
    });
    return height;
  }

  private async drawList(
    block: RenderList,
    x: number,
    topY: number,
    width: number,
  ): Promise<number> {
    let cursorY = topY;
    for (const item of block.items) {
      const markerX = x + block.indent * item.depth;
      const contentX = markerX + block.indent;
      let itemHeight = 0;
      for (const child of item.children) {
        if (itemHeight === 0 && (child.type === 'paragraph' || child.type === 'heading')) {
          const style = child.runs[0]?.style;
          if (style !== undefined) {
            const font = await this.fonts.fontFor(style);
            const isCustom = this.fonts.isCustomFont(style);
            const markerText = isCustom ? item.marker : sanitizeText(item.marker);
            this.page.drawText(markerText, {
              x: markerX,
              y: this.pdfY(cursorY + itemHeight + style.fontSize),
              size: style.fontSize,
              font,
              color: toColor(style.color),
            });
          }
        }
        itemHeight += await this.drawBlock(
          child,
          contentX,
          cursorY + itemHeight,
          width - (contentX - x),
        );
      }
      cursorY += itemHeight;
    }
    return cursorY - topY;
  }

  private async drawTable(
    block: RenderTable,
    x: number,
    topY: number,
    width: number,
  ): Promise<number> {
    const rowHeight = block.bounds.height / Math.max(block.rows.length, 1);
    const totalWidth = block.columnWidths.reduce((sum, w) => sum + w, 0) || width;
    const scale = width / totalWidth;
    let cursorY = topY;
    for (const row of block.rows) {
      let cellX = x;
      for (const [index, cell] of row.cells.entries()) {
        const customWidth =
          index >= 0 && index < block.columnWidths.length
            ? block.columnWidths.at(index)
            : undefined;
        const cellWidth = (customWidth ?? totalWidth / row.cells.length) * scale;
        if (cell.background !== '') {
          this.page.drawRectangle({
            x: cellX,
            y: this.pdfY(cursorY + rowHeight),
            width: cellWidth,
            height: rowHeight,
            color: toColor(cell.background),
          });
        }
        this.page.drawRectangle({
          x: cellX,
          y: this.pdfY(cursorY + rowHeight),
          width: cellWidth,
          height: rowHeight,
          borderColor: toColor(block.borderColor),
          borderWidth: block.borderWidth,
        });
        await this.drawRuns(
          cell.runs,
          cellX + block.cellPadding,
          cursorY + block.cellPadding,
          cellWidth - block.cellPadding * 2,
          cell.alignment,
          1.2,
        );
        cellX += cellWidth;
      }
      cursorY += rowHeight;
    }
    return cursorY - topY;
  }

  private async drawImagePlaceholder(
    block: RenderImage,
    x: number,
    topY: number,
    width: number,
  ): Promise<number> {
    const height = block.bounds.height;
    this.page.drawRectangle({
      x,
      y: this.pdfY(topY + height),
      width: Math.min(width, block.bounds.width),
      height,
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 1,
    });
    const label = sanitizeText(block.alt === '' ? 'Image' : block.alt);
    const font = await this.fonts.fontFor({
      fontFamily: 'Helvetica',
      fontSize: 10,
      fontWeight: 400,
      italic: true,
      color: '#666666',
      underline: false,
      code: false,
      link: '',
    });
    this.page.drawText(label, {
      x: x + 8,
      y: this.pdfY(topY + height / 2),
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    return height;
  }

  private drawRule(block: RenderRule, x: number, topY: number, width: number): number {
    this.page.drawLine({
      start: { x, y: this.pdfY(topY) },
      end: { x: x + width, y: this.pdfY(topY) },
      thickness: block.thickness,
      color: toColor(block.color),
    });
    return block.thickness;
  }
}
