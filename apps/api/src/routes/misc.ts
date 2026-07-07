/**
 * Utility routes:
 *   POST /v1/render   — Returns the Render Tree JSON for debugging/preview.
 *   GET  /v1/formats  — Lists supported export formats and MIME types.
 *   GET  /v1/health   — Liveness probe.
 */

import type { Context } from 'hono';
import { renderMarkdown } from '@seamdoc/core';

const FORMATS = [
  { id: 'docx', label: 'Microsoft Word (.docx)', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { id: 'pdf', label: 'PDF (.pdf)', mimeType: 'application/pdf' },
  { id: 'html', label: 'HTML (.html)', mimeType: 'text/html' },
  { id: 'pptx', label: 'PowerPoint (.pptx)', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  { id: 'odt', label: 'OpenDocument Text (.odt)', mimeType: 'application/vnd.oasis.opendocument.text' },
];

export function healthRoute(c: Context): Response {
  return c.json({ status: 'ok', version: '0.1.0', timestamp: new Date().toISOString() });
}

export function formatsRoute(c: Context): Response {
  return c.json({ formats: FORMATS });
}

export async function renderRoute(c: Context): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json<Record<string, unknown>>();
  } catch {
    return c.json({ error: 'Invalid JSON body', code: 'INVALID_BODY' }, 400);
  }

  const markdown = body['markdown'];
  if (typeof markdown !== 'string' || markdown.trim() === '') {
    return c.json({ error: '`markdown` is required.', code: 'MISSING_MARKDOWN' }, 400);
  }

  const settings = typeof body['settings'] === 'object' && body['settings'] !== null ? body['settings'] : {};
  const metadataOverride = typeof body['metadata'] === 'object' && body['metadata'] !== null ? body['metadata'] : {};
  const theme = typeof body['theme'] === 'string' ? body['theme'] : 'minimal';

  try {
    const outcome = renderMarkdown(markdown, {
      theme,
      settings: settings as never,
      metadata: metadataOverride as never,
    });

    return c.json({
      renderDocument: outcome.renderDocument,
      settings: outcome.settings,
      warnings: outcome.warnings,
    });
  } catch (error) {
    return c.json(
      { error: 'Render failed.', detail: (error as Error).message, code: 'RENDER_ERROR' },
      422,
    );
  }
}
