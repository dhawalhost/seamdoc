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
import type { ExportTemplate } from '@seamdoc/types';
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
  TextRun,
} from '@seamdoc/renderer';

type DocxBlock = Paragraph | Table;

type StyleMapping = ExportTemplate['mapping'];

const NO_MAPPING: StyleMapping = {};

const ALIGNMENT: Record<RenderAlignment, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
};

function toColor(hex: string): string {
  return hex.replace('#', '').toUpperCase();
}

function serializeRun(run: TextRun, templateStyled = false): DocxTextRun {
  // When a template style drives the paragraph, direct font/size/color
  // formatting is omitted so the Word style's typography wins; semantic
  // emphasis (bold/italic/underline) is preserved.
  const options = templateStyled
    ? {
        text: run.text,
        bold: run.style.fontWeight >= 600,
        italics: run.style.italic,
      }
    : {
        text: run.text,
        font: run.style.fontFamily,
        size: pointsToHalfPoints(run.style.fontSize),
        bold: run.style.fontWeight >= 600,
        italics: run.style.italic,
        color: toColor(run.style.color),
      };
  return new DocxTextRun(run.style.underline ? { ...options, underline: {} } : options);
}

function serializeRuns(
  runs: readonly TextRun[],
  templateStyled = false,
): (DocxTextRun | ExternalHyperlink)[] {
  return runs.map((run) => {
    const text = serializeRun(run, templateStyled);
    if (run.style.link !== '') {
      return new ExternalHyperlink({ children: [text], link: run.style.link });
    }
    return text;
  });
}

export function serializeHeading(
  node: RenderHeading,
  mapping: StyleMapping = NO_MAPPING,
): DocxBlock[] {
  const templateStyle = mapping[`h${node.level}`];
  if (templateStyle !== undefined) {
    return [new Paragraph({ style: templateStyle, children: serializeRuns(node.runs, true) })];
  }
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

export function serializeParagraph(
  node: RenderParagraph,
  mapping: StyleMapping = NO_MAPPING,
): DocxBlock[] {
  if (mapping.paragraph !== undefined) {
    return [new Paragraph({ style: mapping.paragraph, children: serializeRuns(node.runs, true) })];
  }
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

export function serializeCodeBlock(
  node: RenderCodeBlock,
  mapping: StyleMapping = NO_MAPPING,
): DocxBlock[] {
  if (mapping.code !== undefined) {
    const codeStyle = mapping.code;
    return node.lines.map(
      (runs) =>
        new Paragraph({
          style: codeStyle,
          children: [new DocxTextRun({ text: runs.map((run) => run.text).join('') })],
        }),
    );
  }
  return node.lines.map(
    (runs, index) =>
      new Paragraph({
        children: runs.map(
          (run) =>
            new DocxTextRun({
              text: run.text,
              font: run.style.fontFamily,
              size: pointsToHalfPoints(run.style.fontSize),
              color: toColor(run.style.color),
              italics: run.style.italic,
              bold: run.style.fontWeight >= 700,
            }),
        ),
        shading: { type: ShadingType.SOLID, color: toColor(node.background) },
        spacing: {
          before: index === 0 ? pointsToTwips(node.spacing.before) : 0,
          after: index === node.lines.length - 1 ? pointsToTwips(node.spacing.after) : 0,
        },
      }),
  );
}

export function serializeQuote(node: RenderQuote, mapping: StyleMapping = NO_MAPPING): DocxBlock[] {
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
      if (mapping.quote !== undefined) {
        return [new Paragraph({ style: mapping.quote, children: serializeRuns(child.runs, true) })];
      }
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
    return serializeBlock(child, mapping);
  });
}

export function serializeList(
  node: RenderList,
  mapping: StyleMapping = NO_MAPPING,
  depth = 0,
): DocxBlock[] {
  const blocks: DocxBlock[] = [];
  const templateStyled = mapping.paragraph !== undefined;
  for (const item of node.items) {
    let firstParagraphDone = false;
    for (const child of item.children) {
      if (child.type === 'paragraph' && !firstParagraphDone) {
        firstParagraphDone = true;
        const markerStyle = child.runs[0]?.style;
        const marker = new DocxTextRun({
          text: `${item.marker} `,
          // Marker typography follows the first run; the docx default
          // applies when the item has no runs or a template style governs.
          ...(markerStyle === undefined || templateStyled
            ? {}
            : {
                font: markerStyle.fontFamily,
                size: pointsToHalfPoints(markerStyle.fontSize),
              }),
        });
        blocks.push(
          new Paragraph({
            ...(templateStyled ? { style: mapping.paragraph } : {}),
            children: [marker, ...serializeRuns(child.runs, templateStyled)],
            indent: { left: pointsToTwips(node.indent * (depth + 1)) },
            spacing: {
              before: pointsToTwips(node.spacing.before),
              after: pointsToTwips(node.spacing.after),
            },
          }),
        );
      } else if (child.type === 'list') {
        blocks.push(...serializeList(child, mapping, depth + 1));
      } else {
        blocks.push(...serializeBlock(child, mapping));
      }
    }
  }
  return blocks;
}

export function serializeTable(node: RenderTable, mapping: StyleMapping = NO_MAPPING): DocxBlock[] {
  const borders = {
    style: BorderStyle.SINGLE,
    size: Math.max(1, Math.round(node.borderWidth * 8)),
    color: toColor(node.borderColor),
  };
  return [
    new Table({
      ...(mapping.table === undefined ? {} : { style: mapping.table }),
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

export function serializeBlock(
  block: RenderBlock,
  mapping: StyleMapping = NO_MAPPING,
): DocxBlock[] {
  switch (block.type) {
    case 'heading':
      return serializeHeading(block, mapping);
    case 'paragraph':
      return serializeParagraph(block, mapping);
    case 'codeBlock':
      return serializeCodeBlock(block, mapping);
    case 'quote':
      return serializeQuote(block, mapping);
    case 'list':
      return serializeList(block, mapping);
    case 'table':
      return serializeTable(block, mapping);
    case 'image':
      return serializeImage(block);
    case 'rule':
      return serializeRule(block);
    case 'columns':
      return block.columns.flatMap((col) =>
        col.children.flatMap((child) => serializeBlock(child, mapping)),
      );
    case 'pageBreak':
      return [];
    default: {
      const exhaustive: never = block;
      throw new Error(`Unhandled render block: ${JSON.stringify(exhaustive)}`);
    }
  }
}

