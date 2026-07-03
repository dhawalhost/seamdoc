/**
 * Plugin SDK contract (docs/02-architecture/rendering-pipeline.md, Stage 7;
 * docs/02-architecture/folder-structure.md, packages/plugins).
 *
 * Plugins extend rendering by transforming the Semantic Document Model
 * before layout. They never touch the rendering engine, themes, or
 * exporters, and they never see the render tree.
 */

import type { SdmDocument } from '@seamdoc/semantic-model';

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
   * Pure transformation of the semantic document. Must return a (possibly
   * new) valid semantic document; must not mutate the input.
   */
  readonly transform: (document: SdmDocument, context: PluginContext) => SdmDocument;
  /** Called once when the plugin is registered. */
  readonly setup?: () => void;
  /** Called once when the plugin is unregistered. */
  readonly teardown?: () => void;
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
