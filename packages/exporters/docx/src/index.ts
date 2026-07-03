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
import type { Exporter, ExportFormat, ExportResult, ExportSettings } from '@seamdoc/types';
import { serializeBlock } from './serializers.js';

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function buildHeaderFooter(
  config: RenderHeaderFooter | null,
  position: 'header' | 'footer',
): Header | Footer | undefined {
  if (config === null) {
    return undefined;
  }
  const children: DocxTextRun[] = [];
  if (config.text !== '') {
    children.push(
      new DocxTextRun({
        text: config.text,
        font: config.style.fontFamily,
        size: pointsToHalfPoints(config.style.fontSize),
        color: config.style.color.replace('#', '').toUpperCase(),
      }),
    );
  }
  if (config.pageNumbers) {
    if (config.text !== '') {
      children.push(new DocxTextRun({ text: '  ' }));
    }
    children.push(
      new DocxTextRun({
        children: [PageNumber.CURRENT],
        font: config.style.fontFamily,
        size: pointsToHalfPoints(config.style.fontSize),
      }),
    );
  }
  const paragraph = new Paragraph({ children, alignment: AlignmentType.CENTER });
  return position === 'header'
    ? new Header({ children: [paragraph] })
    : new Footer({ children: [paragraph] });
}

function buildSection(page: RenderPage): ISectionOptions {
  const landscape = page.width > page.height;
  const header = buildHeaderFooter(page.header, 'header');
  const footer = buildHeaderFooter(page.footer, 'footer');
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
    children: page.children.flatMap(serializeBlock),
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

    const docxDocument = new Document({
      title: settings.metadata.title,
      creator: settings.metadata.author,
      description: settings.metadata.description,
      keywords: settings.metadata.keywords.join(', '),
      sections: document.pages.map(buildSection),
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
