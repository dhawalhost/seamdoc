/**
 * Plugin registration, validation, lifecycle, and isolated execution
 * (docs/02-architecture/rendering-pipeline.md: plugin failure → disable
 * plugin → continue rendering).
 */

import { cloneDocument, validateDocument, type SdmDocument } from '@seamdoc/semantic-model';
import type { ExportFormat, ExportResult } from '@seamdoc/types';
import type { RenderDocument } from '@seamdoc/renderer';
import type {
  PluginContext,
  PluginRunResult,
  PluginRunWarning,
  PluginValidationResult,
  SeamdocPlugin,
} from './types.js';

const ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

/** Structural validation for plugins arriving from untrusted sources. */
export function validatePlugin(input: unknown): PluginValidationResult {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: ['Plugin must be an object.'] };
  }
  const plugin = input as Partial<SeamdocPlugin>;
  if (typeof plugin.id !== 'string' || !ID_PATTERN.test(plugin.id)) {
    errors.push('id: must be a lowercase kebab-case string.');
  }
  if (typeof plugin.name !== 'string' || plugin.name.length === 0) {
    errors.push('name: must be a non-empty string.');
  }
  if (typeof plugin.version !== 'string' || !VERSION_PATTERN.test(plugin.version)) {
    errors.push('version: must be a semantic version (e.g. 1.0.0).');
  }
  if (typeof plugin.transform !== 'function') {
    errors.push('transform: must be a function.');
  }
  if (plugin.setup !== undefined && typeof plugin.setup !== 'function') {
    errors.push('setup: must be a function when present.');
  }
  if (plugin.teardown !== undefined && typeof plugin.teardown !== 'function') {
    errors.push('teardown: must be a function when present.');
  }
  if (plugin.importHook !== undefined && typeof plugin.importHook !== 'function') {
    errors.push('importHook: must be a function when present.');
  }
  if (plugin.exportHook !== undefined && typeof plugin.exportHook !== 'function') {
    errors.push('exportHook: must be a function when present.');
  }
  if (plugin.priority !== undefined && typeof plugin.priority !== 'number') {
    errors.push('priority: must be a number when present.');
  }
  return { valid: errors.length === 0, errors };
}

interface RegisteredPlugin {
  readonly plugin: SeamdocPlugin;
  enabled: boolean;
}

export class PluginRegistry {
  private readonly plugins = new Map<string, RegisteredPlugin>();

  /** Returns plugins sorted by priority (highest first), then registration order. */
  private sortedPlugins(): RegisteredPlugin[] {
    return [...this.plugins.values()].sort(
      (a, b) => (b.plugin.priority ?? 0) - (a.plugin.priority ?? 0),
    );
  }

  /** Validates and registers a plugin; runs its setup hook. */
  register(plugin: SeamdocPlugin): void {
    const validation = validatePlugin(plugin);
    if (!validation.valid) {
      throw new Error(`Invalid plugin: ${validation.errors.join(' ')}`);
    }
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already registered.`);
    }
    plugin.setup?.();
    this.plugins.set(plugin.id, { plugin, enabled: true });
  }

  /** Unregisters a plugin; runs its teardown hook. */
  unregister(id: string): void {
    const entry = this.plugins.get(id);
    if (entry === undefined) {
      return;
    }
    entry.plugin.teardown?.();
    this.plugins.delete(id);
  }

  setEnabled(id: string, enabled: boolean): void {
    const entry = this.plugins.get(id);
    if (entry !== undefined) {
      entry.enabled = enabled;
    }
  }

  isEnabled(id: string): boolean {
    return this.plugins.get(id)?.enabled ?? false;
  }

  list(): readonly SeamdocPlugin[] {
    return this.sortedPlugins().map((entry) => entry.plugin);
  }

  /**
   * Runs enabled import hooks in priority order; returns the first non-null result
   * or null if no hook handles the format.
   */
  runImportHooks(raw: string, format: string): SdmDocument | null {
    for (const entry of this.sortedPlugins()) {
      if (!entry.enabled || entry.plugin.importHook === undefined) continue;
      const pluginId = entry.plugin.id;
      try {
        const result = entry.plugin.importHook(raw, format, {
          warn: (message) => console.warn(`[plugin:${pluginId}] ${message}`),
        });
        if (result !== null) return result;
      } catch {
        // Import hook failures are non-fatal; fall through to next hook.
      }
    }
    return null;
  }

  /**
   * Runs enabled export hooks in priority order; returns the first non-null result
   * or null if no hook handles the format.
   */
  runExportHooks(tree: RenderDocument, format: ExportFormat): ExportResult | null {
    for (const entry of this.sortedPlugins()) {
      if (!entry.enabled || entry.plugin.exportHook === undefined) continue;
      const pluginId = entry.plugin.id;
      try {
        const result = entry.plugin.exportHook(tree, format, {
          warn: (message) => console.warn(`[plugin:${pluginId}] ${message}`),
        });
        if (result !== null) return result;
      } catch {
        // Export hook failures are non-fatal; fall through to next hook.
      }
    }
    return null;
  }

  /**
   * Applies every enabled plugin transform in priority order. A plugin that throws
   * or produces an invalid document is disabled and its change discarded;
   * rendering continues with the previous document.
   */
  run(document: SdmDocument): PluginRunResult {
    const warnings: PluginRunWarning[] = [];
    const disabled: string[] = [];
    let current = document;

    for (const entry of this.sortedPlugins()) {
      if (!entry.enabled) {
        continue;
      }
      const pluginId = entry.plugin.id;
      try {
        // Plugins receive a clone so in-place mutation cannot corrupt the
        // working document if the plugin throws or returns invalid output.
        const context: PluginContext = {
          warn: (message) => warnings.push({ pluginId, message }),
        };
        const next = entry.plugin.transform(cloneDocument(current), context);
        const validation = validateDocument(next);
        if (!validation.valid) {
          const details = validation.issues
            .map((issue) => `${issue.path}: ${issue.message}`)
            .join('; ');
          throw new Error(`plugin produced an invalid document: ${details}`);
        }
        current = next;
      } catch (error) {
        entry.enabled = false;
        disabled.push(pluginId);
        warnings.push({
          pluginId,
          message: `Plugin disabled after failure: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      }
    }

    return { document: current, warnings, disabled };
  }
}
