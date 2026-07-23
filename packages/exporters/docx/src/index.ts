/**
 * DOCX exporter (docs/02-architecture/docx-exporter.md).
 * Serializes a Render Tree into a Microsoft Word document using the docx
 * library. Browser compatible; no theme, layout, or Markdown knowledge.
 */

import {
  Document,
  Footer,
  Header,
  PageNumber,
  PageOrientation,
  Packer,
  Paragraph,
  TextRun as DocxTextRun,
  AlignmentType,
} from 'docx';
import type { ISectionOptions } from 'docx';
import { RENDER_TREE_VERSION } from '@seamdoc/shared';
import { pointsToHalfPoints, pointsToTwips } from '@seamdoc/utils';
import type { RenderDocument, RenderHeaderFooter, RenderPage } from '@seamdoc/renderer';
import type {
  Exporter,
  ExportFormat,
  ExportResult,
  ExportSettings,
  ExportTemplate,
} from '@seamdoc/types';
import { serializeBlock } from './serializers.js';

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function extractTextFromSvgDataUrl(dataUrl: string): string | null {
  try {
    if (dataUrl.startsWith('data:image/svg+xml;base64,')) {
      const base64 = dataUrl.split(',')[1];
      if (base64) {
        let svgText = '';
        const win =
          typeof globalThis !== 'undefined'
            ? (globalThis as unknown as { atob?: (s: string) => string })
            : undefined;
        if (win && typeof win.atob === 'function') {
          svgText = win.atob(base64);
        } else {
          svgText = Buffer.from(base64, 'base64').toString('utf8');
        }
        const textMatch = /<text[^>]*>([^<]+)<\/text>/.exec(svgText);
        if (textMatch && textMatch[1]) {
          return textMatch[1].trim();
        }
      }
    }
  } catch {
    // Fall back to null
  }
  return null;
}

function buildHeaderFooter(
  config: RenderHeaderFooter | null,
  position: 'header' | 'footer',
  mapping: ExportTemplate['mapping'],
  logo?: string | null,
  watermark?: string | null,
): Header | Footer | undefined {
  const children: Paragraph[] = [];

  if (position === 'header' && watermark) {
    const watermarkText = extractTextFromSvgDataUrl(watermark) || 'CONFIDENTIAL';
    children.push(
      new Paragraph({
        children: [
          new DocxTextRun({
            text: watermarkText,
            color: 'E0E0E0',
            size: pointsToHalfPoints(36),
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    );
  }

  const runs: DocxTextRun[] = [];

  if (position === 'header' && logo) {
    const logoText = extractTextFromSvgDataUrl(logo);
    if (logoText) {
      runs.push(
        new DocxTextRun({
          text: `[${logoText}]  `,
          bold: true,
          color: '333333',
          size: pointsToHalfPoints(10),
        }),
      );
    }
  }

  if (config !== null) {
    if (config.text !== '') {
      runs.push(
        new DocxTextRun({
          text: config.text,
          font: config.style.fontFamily,
          size: pointsToHalfPoints(config.style.fontSize),
          color: config.style.color.replace('#', '').toUpperCase(),
        }),
      );
    }
    if (config.pageNumbers) {
      if (config.text !== '' || runs.length > 0) {
        runs.push(new DocxTextRun({ text: '  ' }));
      }
      runs.push(
        new DocxTextRun({
          children: [PageNumber.CURRENT],
          font: config.style.fontFamily,
          size: pointsToHalfPoints(config.style.fontSize),
        }),
      );
    }
  }

  if (runs.length > 0) {
    const styleId =
      position === 'header' ? (mapping.header ?? 'Header') : (mapping.footer ?? 'Footer');
    children.push(
      new Paragraph({
        children: runs,
        alignment: AlignmentType.CENTER,
        style: styleId,
      }),
    );
  }

  if (children.length === 0) {
    return undefined;
  }

  return position === 'header' ? new Header({ children }) : new Footer({ children });
}

function buildSection(page: RenderPage, mapping: ExportTemplate['mapping']): ISectionOptions {
  const landscape = page.width > page.height;
  const header = buildHeaderFooter(page.header, 'header', mapping, page.logo, page.watermark);
  const footer = buildHeaderFooter(page.footer, 'footer', mapping, undefined, page.watermark);
  return {
    properties: {
      page: {
        size: {
          width: pointsToTwips(page.width),
          height: pointsToTwips(page.height),
          orientation: landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
        },
        margin: {
          top: pointsToTwips(page.margins.top),
          right: pointsToTwips(page.margins.right),
          bottom: pointsToTwips(page.margins.bottom),
          left: pointsToTwips(page.margins.left),
        },
      },
    },
    ...(header instanceof Header ? { headers: { default: header } } : {}),
    ...(footer instanceof Footer ? { footers: { default: footer } } : {}),
    children: page.children.flatMap((block) => serializeBlock(block, mapping)),
  };
}

export class DocxExporter implements Exporter<RenderDocument> {
  readonly id = 'docx';
  readonly name = 'DOCX Exporter';
  readonly version = '0.1.0';

  supports(format: ExportFormat): boolean {
    return format === 'docx';
  }

  async export(document: RenderDocument, settings: ExportSettings): Promise<ExportResult> {
    if (document.version !== RENDER_TREE_VERSION) {
      throw new Error(
        `Unsupported render tree version ${document.version}; expected ${RENDER_TREE_VERSION}.`,
      );
    }
    if (document.pages.length === 0) {
      throw new Error('Render tree contains no pages.');
    }

    const mapping = settings.template?.mapping ?? {};
    const docxDocument = new Document({
      title: settings.metadata.title,
      creator: settings.metadata.author,
      description: settings.metadata.description,
      keywords: settings.metadata.keywords.join(', '),
      // Embedding the template's styles.xml makes mapped style ids resolve
      // to the template's formatting (docs/02-architecture/template-engine.md).
      ...(settings.template === undefined ? {} : { externalStyles: settings.template.stylesXml }),
      sections: document.pages.map((page) => buildSection(page, mapping)),
    });

    const blob = await Packer.toArrayBuffer(docxDocument);
    return {
      filename: settings.filename.endsWith('.docx')
        ? settings.filename
        : `${settings.filename}.docx`,
      mimeType: DOCX_MIME_TYPE,
      data: blob,
    };
  }
}

export const docxExporter = new DocxExporter();
