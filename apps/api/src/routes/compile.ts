/**
 * POST /v1/compile
 * Compiles Markdown (or other supported formats) to an exported document binary.
 *
 * Body (JSON):
 * {
 *   markdown: string;       // Required. The source document content.
 *   format?: string;        // Output format: docx | pdf | html | pptx | odt. Default: docx.
 *   filename?: string;      // Base filename (without extension). Default: "document".
 *   settings?: object;      // Partial DocumentSettings overrides.
 *   metadata?: object;      // Partial DocumentMetadata overrides.
 *   theme?: string;         // Built-in theme name. Default: "minimal".
 * }
 *
 * Response: Binary document with Content-Disposition header.
 */

import type { Context } from 'hono';
import { ExporterRegistry, renderMarkdown } from '@seamdoc/core';
import { docxExporter } from '@seamdoc/exporter-docx';
import { pdfExporter } from '@seamdoc/exporter-pdf';
import { htmlExporter } from '@seamdoc/exporter-html';
import { pptxExporter } from '@seamdoc/exporter-pptx';
import { odtExporter } from '@seamdoc/exporter-odt';
import { DEFAULT_DOCUMENT_METADATA } from '@seamdoc/shared';
import type { ExportFormat } from '@seamdoc/types';

const SUPPORTED_FORMATS = new Set<ExportFormat>(['docx', 'pdf', 'html', 'pptx', 'odt']);

const MIME_TYPES: Record<ExportFormat, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  html: 'text/html; charset=utf-8',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text',
  epub: 'application/epub+zip',
};

function buildRegistry(): ExporterRegistry {
  const registry = new ExporterRegistry();
  registry.register(docxExporter);
  registry.register(pdfExporter);
  registry.register(htmlExporter);
  registry.register(pptxExporter);
  registry.register(odtExporter);
  return registry;
}

export async function compileRoute(c: Context): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json<Record<string, unknown>>();
  } catch {
    return c.json({ error: 'Invalid JSON body', code: 'INVALID_BODY' }, 400);
  }

  const markdown = body['markdown'];
  if (typeof markdown !== 'string' || markdown.trim() === '') {
    return c.json(
      { error: '`markdown` is required and must be a non-empty string.', code: 'MISSING_MARKDOWN' },
      400,
    );
  }

  const format = (body['format'] as ExportFormat | undefined) ?? 'docx';
  if (!SUPPORTED_FORMATS.has(format)) {
    return c.json(
      {
        error: `Unsupported format "${format}". Supported: ${[...SUPPORTED_FORMATS].join(', ')}.`,
        code: 'UNSUPPORTED_FORMAT',
      },
      400,
    );
  }

  const filename = typeof body['filename'] === 'string' ? body['filename'] : 'document';
  const settings =
    typeof body['settings'] === 'object' && body['settings'] !== null ? body['settings'] : {};
  const metadataOverride =
    typeof body['metadata'] === 'object' && body['metadata'] !== null ? body['metadata'] : {};
  const theme = typeof body['theme'] === 'string' ? body['theme'] : 'minimal';

  let outcome;
  try {
    outcome = renderMarkdown(markdown, {
      theme,
      settings: settings as never,
      metadata: metadataOverride as never,
    });
  } catch (error) {
    return c.json(
      {
        error: 'Document rendering failed.',
        detail: (error as Error).message,
        code: 'RENDER_ERROR',
      },
      422,
    );
  }

  const registry = buildRegistry();
  const exporter = registry.find(format);
  if (!exporter) {
    return c.json(
      { error: `No exporter found for format "${format}".`, code: 'EXPORTER_NOT_FOUND' },
      500,
    );
  }

  let result;
  try {
    result = await exporter.export(outcome.renderDocument, {
      filename,
      metadata: { ...DEFAULT_DOCUMENT_METADATA, ...outcome.renderDocument.metadata },
    });
  } catch (error) {
    return c.json(
      { error: 'Export failed.', detail: (error as Error).message, code: 'EXPORT_ERROR' },
      500,
    );
  }

  const mimeType = MIME_TYPES[format];
  const safeFilename = `${filename}.${format}`;

  return new Response(result.data, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Content-Length': String(result.data.byteLength),
    },
  });
}
