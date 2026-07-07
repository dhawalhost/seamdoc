/**
 * Plugin SDK contract (docs/02-architecture/rendering-pipeline.md, Stage 7;
 * docs/02-architecture/folder-structure.md, packages/plugins).
 *
 * Plugins extend rendering by transforming the Semantic Document Model
 * before layout. They never touch the rendering engine, themes, or
 * exporters, and they never see the render tree.
 */

import type { SdmDocument } from '@seamdoc/semantic-model';
import type { ExportFormat, ExportResult } from '@seamdoc/types';
import type { RenderDocument } from '@seamdoc/renderer';

export interface PluginContext {
  /** Records a recoverable diagnostic attributed to the plugin. */
  readonly warn: (message: string) => void;
}

export interface SeamdocPlugin {
  /** Unique, stable identifier (lowercase, kebab-case). */
  readonly id: string;
  readonly name: string;
  /** Semantic version of the plugin itself. */
  readonly version: string;
  readonly description?: string;
  /**
   * Execution priority. Higher numbers run before lower numbers.
   * Plugins with equal priority run in registration order.
   * @default 0
   */
  readonly priority?: number;
  /**
   * Pure transformation of the semantic document. Must return a (possibly
   * new) valid semantic document; must not mutate the input.
   */
  readonly transform: (document: SdmDocument, context: PluginContext) => SdmDocument;
  /**
   * Importer hook: intercepts raw source text for a given format before
   * the built-in importer runs. Return null to fall through to the next
   * hook or the built-in importer.
   */
  readonly importHook?: (raw: string, format: string, context: PluginContext) => SdmDocument | null;
  /**
   * Export hook: intercepts the render tree for a given format after
   * layout but before the built-in exporter runs. Return null to fall
   * through to the next hook or the built-in exporter.
   */
  readonly exportHook?: (
    tree: RenderDocument,
    format: ExportFormat,
    context: PluginContext,
  ) => ExportResult | null;
  /** Called once when the plugin is registered. */
  readonly setup?: () => void;
  /** Called once when the plugin is unregistered. */
  readonly teardown?: () => void;
}

/** Declarative manifest for loadPlugin / loadPluginFromUrl. */
export interface SeamdocPluginManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly priority?: number;
  /** URL or path to the JS module that exports the plugin implementation. */
  readonly entrypoint: string;
}

export interface PluginValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export interface PluginRunResult {
  readonly document: SdmDocument;
  /** Diagnostics from plugin warnings and isolated failures. */
  readonly warnings: readonly PluginRunWarning[];
  /** Ids of plugins disabled during this run because they failed. */
  readonly disabled: readonly string[];
}

export interface PluginRunWarning {
  readonly pluginId: string;
  readonly message: string;
}
