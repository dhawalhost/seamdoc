/**
 * Render node serializers (docs/02-architecture/docx-exporter.md).
 * Each render node type maps to a Word construct via the docx library.
 * Serializers receive fully resolved styles and never evaluate themes.
 */

import {
  AlignmentType,
  BorderStyle,
  ExternalHyperlink,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun as DocxTextRun,
  WidthType,
} from 'docx';
import { pointsToHalfPoints, pointsToTwips } from '@seamdoc/utils';
import type {
  RenderAlignment,
  RenderBlock,
  RenderCodeBlock,
  RenderHeading,
  RenderImage,
  RenderList,
  RenderParagraph,
  RenderQuote,
  RenderRule,
  RenderTable,
  RunStyle,
  TextRun,
} from '@seamdoc/renderer';

type DocxBlock = Paragraph | Table;

const ALIGNMENT: Record<RenderAlignment, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
};

function toColor(hex: string): string {
  return hex.replace('#', '').toUpperCase();
}

function serializeRun(run: TextRun): DocxTextRun {
  const options = {
    text: run.text,
    font: run.style.fontFamily,
    size: pointsToHalfPoints(run.style.fontSize),
    bold: run.style.fontWeight >= 600,
    italics: run.style.italic,
    color: toColor(run.style.color),
  };
  return new DocxTextRun(run.style.underline ? { ...options, underline: {} } : options);
}

function serializeRuns(runs: readonly TextRun[]): (DocxTextRun | ExternalHyperlink)[] {
  return runs.map((run) => {
    const text = serializeRun(run);
    if (run.style.link !== '') {
      return new ExternalHyperlink({ children: [text], link: run.style.link });
    }
    return text;
  });
}

export function serializeHeading(node: RenderHeading): DocxBlock[] {
  return [
    new Paragraph({
      children: serializeRuns(node.runs),
      alignment: ALIGNMENT[node.alignment],
      spacing: {
        before: pointsToTwips(node.spacing.before),
        after: pointsToTwips(node.spacing.after),
      },
    }),
  ];
}

export function serializeParagraph(node: RenderParagraph): DocxBlock[] {
  return [
    new Paragraph({
      children: serializeRuns(node.runs),
      alignment: ALIGNMENT[node.alignment],
      spacing: {
        before: pointsToTwips(node.spacing.before),
        after: pointsToTwips(node.spacing.after),
        line: Math.round(node.lineHeight * 240),
      },
    }),
  ];
}

export function serializeCodeBlock(node: RenderCodeBlock): DocxBlock[] {
  const style: RunStyle = node.style;
  return node.lines.map(
    (line, index) =>
      new Paragraph({
        children: [
          new DocxTextRun({
            text: line,
            font: style.fontFamily,
            size: pointsToHalfPoints(style.fontSize),
            color: toColor(style.color),
          }),
        ],
        shading: { type: ShadingType.SOLID, color: toColor(node.background) },
        spacing: {
          before: index === 0 ? pointsToTwips(node.spacing.before) : 0,
          after: index === node.lines.length - 1 ? pointsToTwips(node.spacing.after) : 0,
        },
      }),
  );
}

export function serializeQuote(node: RenderQuote): DocxBlock[] {
  const indent = pointsToTwips(node.indent);
  const border = {
    left: {
      style: BorderStyle.SINGLE,
      size: Math.round(node.borderWidth * 8),
      color: toColor(node.borderColor),
    },
  };
  return node.children.flatMap((child) => {
    if (child.type === 'paragraph') {
      return [
        new Paragraph({
          children: serializeRuns(child.runs),
          alignment: ALIGNMENT[child.alignment],
          indent: { left: indent },
          border,
          spacing: {
            before: pointsToTwips(child.spacing.before),
            after: pointsToTwips(child.spacing.after),
          },
        }),
      ];
    }
    return serializeBlock(child);
  });
}

export function serializeList(node: RenderList, depth = 0): DocxBlock[] {
  const blocks: DocxBlock[] = [];
  for (const item of node.items) {
    let firstParagraphDone = false;
    for (const child of item.children) {
      if (child.type === 'paragraph' && !firstParagraphDone) {
        firstParagraphDone = true;
        blocks.push(
          new Paragraph({
            children: [
              new DocxTextRun({
                text: `${item.marker} `,
                font: child.runs[0]?.style.fontFamily ?? 'Calibri',
                size: pointsToHalfPoints(child.runs[0]?.style.fontSize ?? 11),
              }),
              ...serializeRuns(child.runs),
            ],
            indent: { left: pointsToTwips(node.indent * (depth + 1)) },
            spacing: {
              before: pointsToTwips(node.spacing.before),
              after: pointsToTwips(node.spacing.after),
            },
          }),
        );
      } else if (child.type === 'list') {
        blocks.push(...serializeList(child, depth + 1));
      } else {
        blocks.push(...serializeBlock(child));
      }
    }
  }
  return blocks;
}

export function serializeTable(node: RenderTable): DocxBlock[] {
  const borders = {
    style: BorderStyle.SINGLE,
    size: Math.max(1, Math.round(node.borderWidth * 8)),
    color: toColor(node.borderColor),
  };
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: node.rows.map(
        (row) =>
          new TableRow({
            tableHeader: row.header,
            children: row.cells.map((cell) => {
              const base = {
                children: [
                  new Paragraph({
                    children: serializeRuns(cell.runs),
                    alignment: ALIGNMENT[cell.alignment],
                  }),
                ],
                borders: {
                  top: borders,
                  bottom: borders,
                  left: borders,
                  right: borders,
                },
              };
              return new TableCell(
                cell.background === ''
                  ? base
                  : {
                      ...base,
                      shading: { type: ShadingType.SOLID, color: toColor(cell.background) },
                    },
              );
            }),
          }),
      ),
    }),
  ];
}

export function serializeImage(node: RenderImage): DocxBlock[] {
  // Data-URL and binary asset embedding arrives with the asset manager;
  // until then images render as an aligned alt-text placeholder paragraph.
  return [
    new Paragraph({
      children: [
        new DocxTextRun({ text: node.alt === '' ? '[image]' : `[${node.alt}]`, italics: true }),
      ],
      alignment: ALIGNMENT[node.alignment],
      spacing: {
        before: pointsToTwips(node.spacing.before),
        after: pointsToTwips(node.spacing.after),
      },
    }),
  ];
}

export function serializeRule(node: RenderRule): DocxBlock[] {
  return [
    new Paragraph({
      children: [],
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: Math.max(1, Math.round(node.thickness * 8)),
          color: toColor(node.color),
        },
      },
      spacing: {
        before: pointsToTwips(node.spacing.before),
        after: pointsToTwips(node.spacing.after),
      },
    }),
  ];
}

export function serializeBlock(block: RenderBlock): DocxBlock[] {
  switch (block.type) {
    case 'heading':
      return serializeHeading(block);
    case 'paragraph':
      return serializeParagraph(block);
    case 'codeBlock':
      return serializeCodeBlock(block);
    case 'quote':
      return serializeQuote(block);
    case 'list':
      return serializeList(block);
    case 'table':
      return serializeTable(block);
    case 'image':
      return serializeImage(block);
    case 'rule':
      return serializeRule(block);
    default: {
      const exhaustive: never = block;
      throw new Error(`Unhandled render block: ${JSON.stringify(exhaustive)}`);
    }
  }
}
