import { describe, it, expect } from 'vitest';
import { mermaidPlugin } from './index.js';
import { PluginRegistry } from '@seamdoc/plugins';
import type { SdmDocument } from '@seamdoc/semantic-model';

const BASE_DOCUMENT: SdmDocument = {
  type: 'document',
  version: 1,
  metadata: {
    title: 'Test',
    author: '',
    description: '',
    keywords: [],
    language: 'en',
    createdAt: '',
    updatedAt: '',
  },
  children: [],
};

describe('mermaidPlugin', () => {
  it('has the correct plugin id and version', () => {
    expect(mermaidPlugin.id).toBe('mermaid');
    expect(mermaidPlugin.version).toBe('0.1.0');
  });

  it('can be registered in a PluginRegistry without error', () => {
    const registry = new PluginRegistry();
    expect(() => registry.register(mermaidPlugin)).not.toThrow();
    expect(registry.isEnabled('mermaid')).toBe(true);
  });

  it('passes non-mermaid blocks through unchanged', () => {
    const registry = new PluginRegistry();
    registry.register(mermaidPlugin);

    const doc: SdmDocument = {
      ...BASE_DOCUMENT,
      children: [
        {
          type: 'code',
          language: 'typescript',
          value: 'const x = 1;',
        },
      ],
    };

    const result = registry.run(doc);
    expect(result.document.children).toHaveLength(1);
    expect(result.document.children[0]?.type).toBe('code');
  });

  it('preserves mermaid block when window.mermaid is unavailable (Node.js environment)', () => {
    const registry = new PluginRegistry();
    registry.register(mermaidPlugin);

    const doc: SdmDocument = {
      ...BASE_DOCUMENT,
      children: [
        {
          type: 'code',
          language: 'mermaid',
          value: 'graph TD; A-->B;',
        },
      ],
    };

    // In Node.js test environment, window.mermaid is undefined, so the code
    // block is preserved unchanged as a safe fallback.
    const result = registry.run(doc);
    // The synchronous transform returns null (fallback), preserving the block.
    expect(result.document.children).toHaveLength(1);
    expect(result.document.children[0]?.type).toBe('code');
  });

  it('emits a warning for empty mermaid blocks', () => {
    const registry = new PluginRegistry();
    registry.register(mermaidPlugin);

    const doc: SdmDocument = {
      ...BASE_DOCUMENT,
      children: [
        {
          type: 'code',
          language: 'mermaid',
          value: '   ',
        },
      ],
    };

    const result = registry.run(doc);
    expect(result.warnings.some((w) => w.pluginId === 'mermaid')).toBe(true);
  });
});
