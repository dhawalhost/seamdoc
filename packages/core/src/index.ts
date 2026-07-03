/**
 * Core orchestration (docs/02-architecture/document-engine.md).
 * Coordinates the full pipeline: Markdown → mdast → SDM → validation →
 * layout → Render Tree → exporter. Contains no UI and no export-format
 * knowledge beyond the exporter registry.
 */

import type {
  DocumentMetadata,
  DocumentSettings,
  Exporter,
  ExportFormat,
  ExportResult,
} from '@seamdoc/types';
import { DEFAULT_DOCUMENT_METADATA, DEFAULT_DOCUMENT_SETTINGS } from '@seamdoc/shared';
import { parseMarkdown } from '@seamdoc/parser';
import { fromMdast, validateDocument, type SdmDocument } from '@seamdoc/semantic-model';
import { layoutDocument, type RenderDocument } from '@seamdoc/renderer';
import { getBuiltinTheme, minimalTheme, type Theme } from '@seamdoc/themes';

export interface RenderOptions {
  readonly theme?: Theme | string;
  readonly settings?: Partial<DocumentSettings>;
  readonly metadata?: Partial<DocumentMetadata>;
}

export interface RenderOutcome {
  readonly semanticDocument: SdmDocument;
  readonly renderDocument: RenderDocument;
  readonly theme: Theme;
  readonly settings: DocumentSettings;
}

function resolveTheme(theme: Theme | string | undefined): Theme {
  if (theme === undefined) {
    return minimalTheme;
  }
  if (typeof theme === 'string') {
    // Unknown theme ids fall back to the default theme so rendering
    // continues (docs/02-architecture/rendering-pipeline.md, error handling).
    return getBuiltinTheme(theme) ?? minimalTheme;
  }
  return theme;
}

/** Runs the pipeline from Markdown text to a Render Tree. */
export function renderMarkdown(markdown: string, options: RenderOptions = {}): RenderOutcome {
  const theme = resolveTheme(options.theme);
  const settings: DocumentSettings = { ...DEFAULT_DOCUMENT_SETTINGS, ...options.settings };

  const ast = parseMarkdown(markdown);
  const semanticDocument = fromMdast(
    ast,
    options.metadata === undefined ? {} : { metadata: options.metadata },
  );

  const validation = validateDocument(semanticDocument);
  if (!validation.valid) {
    const details = validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ');
    throw new Error(`Semantic document validation failed: ${details}`);
  }

  const renderDocument = layoutDocument({ document: semanticDocument, theme, settings });
  return { semanticDocument, renderDocument, theme, settings };
}

export class ExporterRegistry {
  private readonly exporters = new Map<string, Exporter<RenderDocument>>();

  register(exporter: Exporter<RenderDocument>): void {
    this.exporters.set(exporter.id, exporter);
  }

  find(format: ExportFormat): Exporter<RenderDocument> | undefined {
    for (const exporter of this.exporters.values()) {
      if (exporter.supports(format)) {
        return exporter;
      }
    }
    return undefined;
  }

  list(): readonly Exporter<RenderDocument>[] {
    return [...this.exporters.values()];
  }
}

export interface ExportMarkdownOptions extends RenderOptions {
  readonly format: ExportFormat;
  readonly filename?: string;
}

/** End-to-end convenience: Markdown text to an exported document. */
export async function exportMarkdown(
  markdown: string,
  registry: ExporterRegistry,
  options: ExportMarkdownOptions,
): Promise<ExportResult> {
  const exporter = registry.find(options.format);
  if (exporter === undefined) {
    throw new Error(`No exporter registered for format "${options.format}".`);
  }
  const outcome = renderMarkdown(markdown, options);
  return exporter.export(outcome.renderDocument, {
    filename: options.filename ?? 'document',
    metadata: { ...DEFAULT_DOCUMENT_METADATA, ...options.metadata },
  });
}
