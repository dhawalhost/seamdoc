/**
 * PDF exporter (docs/02-architecture/exporter-sdk.md). Serializes a Render
 * Tree into a PDF using pdf-lib. Browser compatible; consumes only the
 * render tree, with no theme, layout, or Markdown knowledge.
 */

import { PDFDocument } from 'pdf-lib';
import { RENDER_TREE_VERSION } from '@seamdoc/shared';
import type { RenderDocument } from '@seamdoc/renderer';
import type { Exporter, ExportFormat, ExportResult, ExportSettings } from '@seamdoc/types';
import { FontRegistry } from './fonts.js';
import { PageRenderer } from './draw.js';

const PDF_MIME_TYPE = 'application/pdf';

/** Fixed fallback keeps output deterministic when metadata has no dates. */
const EPOCH = new Date(0);

function parseDate(iso: string): Date {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? EPOCH : date;
}

export class PdfExporter implements Exporter<RenderDocument> {
  readonly id = 'pdf';
  readonly name = 'PDF Exporter';
  readonly version = '0.1.0';

  supports(format: ExportFormat): boolean {
    return format === 'pdf';
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

    const pdf = await PDFDocument.create();
    pdf.setTitle(settings.metadata.title);
    pdf.setAuthor(settings.metadata.author);
    pdf.setSubject(settings.metadata.description);
    pdf.setKeywords([...settings.metadata.keywords]);
    pdf.setLanguage(settings.metadata.language);
    pdf.setProducer('Seamdoc');
    pdf.setCreator('Seamdoc');
    pdf.setCreationDate(parseDate(settings.metadata.createdAt));
    pdf.setModificationDate(parseDate(settings.metadata.updatedAt));

    const fonts = new FontRegistry(pdf);
    for (const [index, pageSpec] of document.pages.entries()) {
      const page = pdf.addPage([pageSpec.width, pageSpec.height]);
      await new PageRenderer(page, pageSpec, fonts, index + 1).drawPage();
    }

    const bytes = await pdf.save({ useObjectStreams: false });
    const data = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    return {
      filename: settings.filename.endsWith('.pdf') ? settings.filename : `${settings.filename}.pdf`,
      mimeType: PDF_MIME_TYPE,
      data,
    };
  }
}

export const pdfExporter = new PdfExporter();
