/** Plugin SDK: plugin API, registration, lifecycle, validation, execution, loading. */

export type {
  PluginContext,
  PluginRunResult,
  PluginRunWarning,
  PluginValidationResult,
  SeamdocPlugin,
  SeamdocPluginManifest,
} from './types.js';
export { PluginRegistry, validatePlugin } from './registry.js';
export { createCodeBlockPlugin, definePlugin, type CodeBlockPluginOptions } from './helpers.js';
export { loadPlugin, loadPluginFromUrl, pluginLoaderHelper } from './loader.js';

/**
 * Stable list of first-party plugin IDs shipped in packages/plugins-community/.
 * These are NOT auto-registered — callers must explicitly import and register
 * the desired plugins. This list serves as a discoverable reference.
 */
export const BUILTIN_PLUGIN_IDS = ['mermaid', 'latex', 'latex-alt'] as const;
export type BuiltinPluginId = (typeof BUILTIN_PLUGIN_IDS)[number];
