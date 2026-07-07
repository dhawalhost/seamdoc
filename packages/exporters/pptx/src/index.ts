import pptxgen from 'pptxgenjs';
import { RENDER_TREE_VERSION } from '@seamdoc/shared';
import type { RenderDocument, RenderBlock, TextRun } from '@seamdoc/renderer';
import type { Exporter, ExportFormat, ExportResult, ExportSettings } from '@seamdoc/types';

const ptToIn = (pt: number): number => pt / 72;

function escapeHexColor(color: string): string {
  return color.startsWith('#') ? color.substring(1) : color;
}

function mapRunsToPptx(runs: readonly TextRun[]): Record<string, unknown>[] {
  return runs.map((run) => {
    return {
      text: run.text,
      options: {
        fontFace: run.style.fontFamily,
        fontSize: run.style.fontSize,
        bold: run.style.fontWeight >= 700,
        italic: run.style.italic,
        color: escapeHexColor(run.style.color),
        underline: run.style.underline ? { style: 'single' } : undefined,
      },
    };
  });
}

function serializeBlock(
  slide: pptxgen.Slide,
  pptx: pptxgen,
  block: RenderBlock,
): void {
  const position = {
    x: ptToIn(block.bounds.x),
    y: ptToIn(block.bounds.y),
    w: ptToIn(block.bounds.width),
    h: ptToIn(block.bounds.height),
  };

  switch (block.type) {
    case 'heading': {
      slide.addText(mapRunsToPptx(block.runs), {
        ...position,
        align: block.alignment,
        valign: 'top',
        margin: 0,
      });
      break;
    }
    case 'paragraph': {
      slide.addText(mapRunsToPptx(block.runs), {
        ...position,
        align: block.alignment,
        valign: 'top',
        margin: 0,
      });
      break;
    }
    case 'codeBlock': {
      const codeParagraphs = block.lines.flatMap((lineRuns, lineIdx) => {
        const runs = mapRunsToPptx(lineRuns);
        if (lineIdx < block.lines.length - 1 && runs.length > 0) {
          runs[runs.length - 1]!.text += '\n';
        }
        return runs;
      });

      slide.addText(codeParagraphs, {
        ...position,
        fontFace: block.style.fontFamily,
        fontSize: block.style.fontSize,
        color: escapeHexColor(block.style.color),
        fill: { color: escapeHexColor(block.background) },
        align: 'left',
        valign: 'top',
        margin: block.padding,
      });
      break;
    }
    case 'quote': {
      const borderLeft = ptToIn(block.borderWidth);
      const borderColor = escapeHexColor(block.borderColor);

      // Draw left vertical accent line
      slide.addShape(pptx.ShapeType.rect, {
        x: position.x,
        y: position.y,
        w: borderLeft,
        h: position.h,
        fill: { color: borderColor },
        line: { color: borderColor, width: 0 },
      });

      const quoteRuns = block.children.flatMap((child) => {
        if (child.type === 'paragraph') {
          return mapRunsToPptx(child.runs);
        }
        return [];
      });

      slide.addText(quoteRuns, {
        x: position.x + borderLeft + ptToIn(block.indent),
        y: position.y,
        w: position.w - borderLeft - ptToIn(block.indent),
        h: position.h,
        valign: 'top',
        margin: 0,
      });
      break;
    }
    case 'list': {
      const listRuns = block.items.flatMap((item, idx) => {
        const itemRuns = item.children.flatMap((child) => {
          if (child.type === 'paragraph') {
            return mapRunsToPptx(child.runs);
          }
          return [];
        });

        const prefix = block.ordered ? `${idx + 1}. ` : '• ';
        if (itemRuns.length > 0) {
          itemRuns[0]!.text = prefix + itemRuns[0]!.text;
        }

        if (idx < block.items.length - 1 && itemRuns.length > 0) {
          itemRuns[itemRuns.length - 1]!.text += '\n';
        }
        return itemRuns;
      });

      slide.addText(listRuns, {
        ...position,
        valign: 'top',
        margin: 0,
      });
      break;
    }
    case 'table': {
      const pptxRows = block.rows.map((row) => {
        return row.cells.map((cell) => {
          const runs = mapRunsToPptx(cell.runs);
          const cellColor = escapeHexColor(cell.background);

          const cellOptions: Record<string, unknown> = {
            align: cell.alignment,
            valign: 'middle' as const,
          };
          if (cellColor !== '') {
            cellOptions.fill = { color: cellColor };
          }

          return {
            text: runs,
            options: cellOptions,
          };
        });
      });

      slide.addTable(pptxRows, {
        x: position.x,
        y: position.y,
        w: position.w,
        h: position.h,
        border: {
          pt: block.borderWidth,
          color: escapeHexColor(block.borderColor),
        },
      });
      break;
    }
    case 'image': {
      slide.addImage({
        path: block.src,
        x: position.x,
        y: position.y,
        w: position.w,
        h: position.h,
      });
      break;
    }
    case 'rule': {
      slide.addShape(pptx.ShapeType.line, {
        x: position.x,
        y: position.y,
        w: position.w,
        h: ptToIn(block.thickness),
        line: { color: escapeHexColor(block.color), width: block.thickness },
      });
      break;
    }
    case 'columns': {
      block.columns.forEach((col) => {
        col.children.forEach((child) => {
          serializeBlock(slide, pptx, child);
        });
      });
      break;
    }
    default: {
      const exhaustive: never = block;
      throw new Error(`Unhandled block type: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export class PptxExporter implements Exporter<RenderDocument> {
  readonly id = 'pptx';
  readonly name = 'PPTX Exporter';
  readonly version = '0.1.0';

  supports(format: ExportFormat): boolean {
    return format === 'pptx';
  }

  async export(document: RenderDocument, settings: ExportSettings): Promise<ExportResult> {
    if (document.version !== RENDER_TREE_VERSION) {
      throw new Error(
        `Unsupported render tree version ${document.version}; expected ${RENDER_TREE_VERSION}.`,
      );
    }

    const pptx = new pptxgen();

    // Configure Slide Sizes corresponding to first page dimensions
    if (document.pages.length > 0) {
      const firstPage = document.pages[0]!;
      const slideWidthIn = ptToIn(firstPage.width);
      const slideHeightIn = ptToIn(firstPage.height);
      
      // Standard or Custom sizes
      pptx.defineLayout({
        name: 'CUSTOM_LAYOUT',
        width: slideWidthIn,
        height: slideHeightIn,
      });
      pptx.layout = 'CUSTOM_LAYOUT';
    }

    // Set Document Metadata
    pptx.title = settings.metadata.title || 'Untitled Presentation';
    pptx.author = settings.metadata.author || 'Seamdoc';
    pptx.subject = settings.metadata.description || '';

    // Create Slides
    for (const page of document.pages) {
      const slide = pptx.addSlide();

      // Draw page border if present
      if (page.border !== null) {
        slide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: ptToIn(page.width),
          h: ptToIn(page.height),
          fill: { color: 'none' },
          line: {
            color: escapeHexColor(page.border.color),
            width: page.border.width,
            dashType: page.border.style === 'dashed' ? 'dash' : 'solid',
          },
        });
      }

      // Renders headers and footers as visual shapes if present
      if (page.header !== null) {
        slide.addText(page.header.text, {
          x: ptToIn(page.margins.left),
          y: ptToIn(18), // 0.25 inches from top
          w: ptToIn(page.width - page.margins.left - page.margins.right),
          h: ptToIn(24),
          fontFace: page.header.style.fontFamily,
          fontSize: page.header.style.fontSize,
          color: escapeHexColor(page.header.style.color),
          align: 'center',
          valign: 'middle',
        });
      }

      if (page.footer !== null) {
        slide.addText(page.footer.text, {
          x: ptToIn(page.margins.left),
          y: ptToIn(page.height - page.margins.bottom + 12),
          w: ptToIn(page.width - page.margins.left - page.margins.right),
          h: ptToIn(24),
          fontFace: page.footer.style.fontFamily,
          fontSize: page.footer.style.fontSize,
          color: escapeHexColor(page.footer.style.color),
          align: 'center',
          valign: 'middle',
        });
      }

      // Render Page Content Blocks
      for (const block of page.children) {
        serializeBlock(slide, pptx, block);
      }
    }

    const data = (await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer;

    const resolvedFilename = settings.filename.endsWith('.pptx')
      ? settings.filename
      : `${settings.filename}.pptx`;

    return {
      filename: resolvedFilename,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      data,
    };
  }
}

export const pptxExporter = new PptxExporter();
export default pptxExporter;
