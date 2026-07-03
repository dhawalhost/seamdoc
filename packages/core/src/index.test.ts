import { describe, expect, it } from 'vitest';
import { ExporterRegistry, renderMarkdown } from './index.js';
import type { Exporter, ExportFormat, ExportResult, ExportSettings } from '@seamdoc/types';
import type { RenderDocument } from '@seamdoc/renderer';
import { PluginRegistry, createCodeBlockPlugin } from '@seamdoc/plugins';

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

  it('runs plugins on the SDM before layout (pipeline stage 7)', () => {
    const plugins = new PluginRegistry();
    plugins.register(
      createCodeBlockPlugin({
        id: 'mermaid',
        name: 'Mermaid',
        version: '1.0.0',
        language: 'mermaid',
        transformBlock: () => [
          {
            type: 'paragraph',
            children: [{ type: 'image', src: 'diagram.svg', alt: 'Diagram', title: null }],
          },
        ],
      }),
    );

    const outcome = renderMarkdown('```mermaid\ngraph TD; A-->B;\n```', { plugins });
    const block = outcome.semanticDocument.children[0];
    expect(block?.type).toBe('paragraph');
    expect(outcome.warnings).toEqual([]);
  });

  it('surfaces isolated plugin failures as pipeline warnings', () => {
    const plugins = new PluginRegistry();
    plugins.register({
      id: 'explodes',
      name: 'Explodes',
      version: '1.0.0',
      transform: () => {
        throw new Error('boom');
      },
    });

    const outcome = renderMarkdown('# Still renders', { plugins });
    expect(outcome.renderDocument.pages.length).toBeGreaterThan(0);
    expect(outcome.warnings[0]?.stage).toBe('plugin:explodes');
    expect(outcome.warnings[0]?.message).toContain('boom');
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
