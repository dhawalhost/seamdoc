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
  ExportTemplate,
  PipelineWarning,
} from '@seamdoc/types';
import { DEFAULT_DOCUMENT_METADATA, DEFAULT_DOCUMENT_SETTINGS } from '@seamdoc/shared';
import { parseMarkdown } from '@seamdoc/parser';
import { fromMdast, validateDocument, type SdmDocument } from '@seamdoc/semantic-model';
import { layoutDocument, validateRenderTree, type RenderDocument } from '@seamdoc/renderer';
import { getBuiltinTheme, minimalTheme, validateTheme, type Theme } from '@seamdoc/themes';
import type { PluginRegistry } from '@seamdoc/plugins';

export { initHighlighter, isHighlighterReady } from '@seamdoc/highlighter';

export interface RenderOptions {
  readonly theme?: Theme | string;
  readonly settings?: Partial<DocumentSettings>;
  readonly metadata?: Partial<DocumentMetadata>;
  /** Plugins transform the SDM before layout (pipeline stage 7). */
  readonly plugins?: PluginRegistry;
}

export interface RenderOutcome {
  readonly semanticDocument: SdmDocument;
  readonly renderDocument: RenderDocument;
  readonly theme: Theme;
  readonly settings: DocumentSettings;
  /** Recoverable diagnostics, e.g. isolated plugin failures. */
  readonly warnings: readonly PipelineWarning[];
}

export {
  runHeuristicCritic,
  analyzeDocumentStructure,
  generateThemeFromPrompt,
  type CriticFinding,
} from './ai.js';

function resolveTheme(theme: Theme | string | undefined): Theme {
  if (theme === undefined) {
    return minimalTheme;
  }
  if (typeof theme === 'string') {
    // Unknown theme ids fall back to the default theme so rendering
    // continues (docs/02-architecture/rendering-pipeline.md, error handling).
    return getBuiltinTheme(theme) ?? minimalTheme;
  }
  // Invalid themes must never reach the renderer
  // (docs/02-architecture/theme-engine.md); fall back to the default theme.
  const validation = validateTheme(theme);
  return validation.valid && validation.theme !== null ? validation.theme : minimalTheme;
}

/** Runs the pipeline from Markdown text to a Render Tree. */
export function renderMarkdown(markdown: string, options: RenderOptions = {}): RenderOutcome {
  const theme = resolveTheme(options.theme);
  const settings: DocumentSettings = { ...DEFAULT_DOCUMENT_SETTINGS, ...options.settings };

  const ast = parseMarkdown(markdown);
  let semanticDocument = fromMdast(
    ast,
    options.metadata === undefined ? {} : { metadata: options.metadata },
  );

  const validation = validateDocument(semanticDocument);
  if (!validation.valid) {
    const details = validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ');
    throw new Error(`Semantic document validation failed: ${details}`);
  }

  const warnings: PipelineWarning[] = [];
  if (options.plugins !== undefined) {
    const pluginResult = options.plugins.run(semanticDocument);
    semanticDocument = pluginResult.document;
    for (const warning of pluginResult.warnings) {
      warnings.push({ stage: `plugin:${warning.pluginId}`, message: warning.message });
    }

    const postPluginValidation = validateDocument(semanticDocument);
    if (!postPluginValidation.valid) {
      const details = postPluginValidation.issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join('; ');
      throw new Error(`Semantic document validation failed after plugins: ${details}`);
    }
  }

  const renderDocument = layoutDocument({ document: semanticDocument, theme, settings });

  const treeValidation = validateRenderTree(renderDocument);
  if (!treeValidation.valid) {
    const details = treeValidation.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('; ');
    throw new Error(`Render tree validation failed: ${details}`);
  }

  return { semanticDocument, renderDocument, theme, settings, warnings };
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
  /** Template profile applied by exporters that support native styles. */
  readonly template?: ExportTemplate;
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
    ...(options.template === undefined ? {} : { template: options.template }),
  });
}
