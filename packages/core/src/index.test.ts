import { describe, expect, it } from 'vitest';
import { ExporterRegistry, renderMarkdown } from './index.js';
import type { Exporter, ExportFormat, ExportResult, ExportSettings } from '@seamdoc/types';
import type { RenderDocument } from '@seamdoc/renderer';

describe('renderMarkdown', () => {
  it('runs the full pipeline from Markdown to render tree', () => {
    const outcome = renderMarkdown('# Hello\n\nWorld');
    expect(outcome.semanticDocument.children).toHaveLength(2);
    expect(outcome.renderDocument.pages.length).toBeGreaterThan(0);
    expect(outcome.theme.metadata.id).toBe('minimal');
  });

  it('resolves themes by id and falls back to minimal for unknown ids', () => {
    expect(renderMarkdown('x', { theme: 'github' }).theme.metadata.id).toBe('github');
    expect(renderMarkdown('x', { theme: 'nope' }).theme.metadata.id).toBe('minimal');
  });

  it('applies document settings and metadata', () => {
    const outcome = renderMarkdown('x', {
      settings: { orientation: 'landscape' },
      metadata: { title: 'My Doc' },
    });
    expect(outcome.settings.orientation).toBe('landscape');
    expect(outcome.renderDocument.metadata.title).toBe('My Doc');
  });
});

describe('ExporterRegistry', () => {
  const stubExporter: Exporter<RenderDocument> = {
    id: 'stub',
    name: 'Stub',
    version: '0.0.1',
    supports: (format: ExportFormat) => format === 'html',
    export: (_doc: RenderDocument, settings: ExportSettings): Promise<ExportResult> =>
      Promise.resolve({
        filename: settings.filename,
        mimeType: 'text/html',
        data: new ArrayBuffer(0),
      }),
  };

  it('registers and finds exporters by supported format', () => {
    const registry = new ExporterRegistry();
    registry.register(stubExporter);
    expect(registry.find('html')?.id).toBe('stub');
    expect(registry.find('pdf')).toBeUndefined();
    expect(registry.list()).toHaveLength(1);
  });
});
