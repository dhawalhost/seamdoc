/** Plugin SDK: plugin API, registration, lifecycle, validation, execution. */

export type {
  PluginContext,
  PluginRunResult,
  PluginRunWarning,
  PluginValidationResult,
  SeamdocPlugin,
} from './types.js';
export { PluginRegistry, validatePlugin } from './registry.js';
export { createCodeBlockPlugin, definePlugin, type CodeBlockPluginOptions } from './helpers.js';
