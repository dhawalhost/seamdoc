/**
 * Plugin loader utilities for loading plugins from declarative manifests
 * or dynamic URLs (docs/02-architecture/rendering-pipeline.md).
 */

import { validatePlugin } from './registry.js';
import type { SeamdocPlugin, SeamdocPluginManifest } from './types.js';

/**
 * Builds a SeamdocPlugin from a manifest that references an external entrypoint.
 * The entrypoint module must export a `plugin` named export or a default export
 * conforming to the SeamdocPlugin interface.
 */
export async function loadPluginFromUrl(url: string): Promise<SeamdocPlugin> {
  const module = await import(/* @vite-ignore */ url) as Record<string, unknown>;
  const candidate = module['plugin'] ?? module['default'];
  const validation = validatePlugin(candidate);
  if (!validation.valid) {
    throw new Error(
      `Plugin loaded from "${url}" failed validation: ${validation.errors.join('; ')}`,
    );
  }
  return candidate as SeamdocPlugin;
}

export const pluginLoaderHelper = {
  loadPluginFromUrl,
};

/**
 * Creates a lazy-loaded plugin wrapper from a declarative manifest.
 * The actual implementation is loaded on first `transform` call.
 * This is useful for deferred loading in browser environments.
 */
export function loadPlugin(manifest: SeamdocPluginManifest): SeamdocPlugin {
  let impl: SeamdocPlugin | null = null;

  const ensureLoaded = async (): Promise<SeamdocPlugin> => {
    if (impl !== null) return impl;
    impl = await pluginLoaderHelper.loadPluginFromUrl(manifest.entrypoint);
    return impl;
  };


  // Return a synchronous facade that delegates to the lazy-loaded impl.
  // For the `transform` hook (which is synchronous by spec), we eagerly
  // pre-load the plugin via setup to avoid async transform calls.
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    ...(manifest.description !== undefined ? { description: manifest.description } : {}),
    ...(manifest.priority !== undefined ? { priority: manifest.priority } : {}),
    transform: (document, context) => {
      if (impl === null) {
        context.warn(
          `Plugin "${manifest.id}" was not pre-loaded; transform is a no-op. Call setup() first.`,
        );
        return document;
      }
      return impl.transform(document, context);
    },
    importHook: (raw, format, context) => {
      return impl?.importHook?.(raw, format, context) ?? null;
    },
    exportHook: (tree, exportFormat, context) => {
      return impl?.exportHook?.(tree, exportFormat, context) ?? null;
    },
    setup: () => {
      // Fire-and-forget load; errors are swallowed (plugin will no-op).
      void ensureLoaded().catch((err: unknown) => {
        console.error(
          `[seamdoc] Failed to load plugin "${manifest.id}": ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    },
    teardown: () => {
      impl?.teardown?.();
      impl = null;
    },
  };
}

