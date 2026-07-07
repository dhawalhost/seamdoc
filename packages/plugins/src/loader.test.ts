import { describe, it, expect, vi } from 'vitest';
import { loadPlugin, pluginLoaderHelper } from './index.js';
import type { SeamdocPluginManifest } from './types.js';
import type { SdmDocument } from '@seamdoc/semantic-model';

describe('Plugin Loader', () => {
  it('loads plugin lazily from manifest', async () => {
    const mockPlugin = {
      id: 'mock-plugin',
      name: 'Mock Plugin',
      version: '1.0.0',
      priority: 10,
      transform: (doc: SdmDocument) => doc,
      importHook: () => null,
      exportHook: () => null,
      setup: () => {},
      teardown: () => {},
    };

    const spy = vi.spyOn(pluginLoaderHelper, 'loadPluginFromUrl').mockResolvedValue(mockPlugin);

    const manifest: SeamdocPluginManifest = {
      id: 'mock-plugin',
      name: 'Mock Plugin',
      version: '1.0.0',
      priority: 10,
      entrypoint: 'mock-plugin-url',
    };

    const plugin = loadPlugin(manifest);
    expect(plugin.id).toBe('mock-plugin');
    expect(plugin.name).toBe('Mock Plugin');
    expect(plugin.version).toBe('1.0.0');
    expect(plugin.priority).toBe(10);

    // Call setup to trigger ensureLoaded
    plugin.setup?.();

    // Small delay to allow fire-and-forget load to complete in setup
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(spy).toHaveBeenCalledWith('mock-plugin-url');

    const mockDoc: SdmDocument = {
      type: 'document',
      version: 1,
      metadata: {
        title: 'Test',
        author: 'Author',
        description: 'Desc',
        keywords: [],
        language: 'en',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      children: [],
    };

    const context = {
      warn: vi.fn(),
    };

    const result = plugin.transform(mockDoc, context);
    expect(result).toBe(mockDoc);
    expect(context.warn).not.toHaveBeenCalled();

    spy.mockRestore();
  });
});
