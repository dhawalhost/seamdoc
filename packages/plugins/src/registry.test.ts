import { describe, expect, it, vi } from 'vitest';
import type { SdmDocument } from '@seamdoc/semantic-model';
import { DEFAULT_DOCUMENT_METADATA, SDM_VERSION } from '@seamdoc/shared';
import { createCodeBlockPlugin, definePlugin, PluginRegistry, validatePlugin } from './index.js';

function makeDocument(): SdmDocument {
  return {
    type: 'document',
    version: SDM_VERSION,
    metadata: DEFAULT_DOCUMENT_METADATA,
    children: [
      { type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] },
      { type: 'code', language: 'mermaid', value: 'graph TD; A-->B;' },
    ],
  };
}

const upperCase = definePlugin({
  id: 'upper-case',
  name: 'Upper Case',
  version: '1.0.0',
  transform: (document) => ({
    ...document,
    children: document.children.map((block) =>
      block.type === 'paragraph'
        ? {
            ...block,
            children: block.children.map((inline) =>
              inline.type === 'text' ? { ...inline, value: inline.value.toUpperCase() } : inline,
            ),
          }
        : block,
    ),
  }),
});

describe('validatePlugin', () => {
  it('accepts a well-formed plugin', () => {
    expect(validatePlugin(upperCase)).toEqual({ valid: true, errors: [] });
  });

  it('rejects malformed plugins with descriptive errors', () => {
    const result = validatePlugin({ id: 'Bad Id', name: '', version: 'x', transform: 42 });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('id:');
    expect(result.errors.join(' ')).toContain('name:');
    expect(result.errors.join(' ')).toContain('version:');
    expect(result.errors.join(' ')).toContain('transform:');
  });
});

describe('PluginRegistry', () => {
  it('registers, lists, and runs plugins in order', () => {
    const registry = new PluginRegistry();
    registry.register(upperCase);
    expect(registry.list().map((plugin) => plugin.id)).toEqual(['upper-case']);

    const result = registry.run(makeDocument());
    const first = result.document.children[0];
    expect(first?.type === 'paragraph' && first.children[0]).toEqual({
      type: 'text',
      value: 'HELLO',
    });
    expect(result.warnings).toEqual([]);
    expect(result.disabled).toEqual([]);
  });

  it('rejects duplicate and invalid registrations', () => {
    const registry = new PluginRegistry();
    registry.register(upperCase);
    expect(() => registry.register(upperCase)).toThrow('already registered');
    expect(() =>
      registry.register({ ...upperCase, id: 'Not Kebab' } as never),
    ).toThrow('Invalid plugin');
  });

  it('runs lifecycle hooks on register and unregister', () => {
    const setup = vi.fn();
    const teardown = vi.fn();
    const registry = new PluginRegistry();
    registry.register({ ...upperCase, id: 'lifecycle', setup, teardown });
    expect(setup).toHaveBeenCalledOnce();
    registry.unregister('lifecycle');
    expect(teardown).toHaveBeenCalledOnce();
    expect(registry.list()).toEqual([]);
  });

  it('isolates a throwing plugin: disables it and continues', () => {
    const registry = new PluginRegistry();
    registry.register({
      id: 'explodes',
      name: 'Explodes',
      version: '1.0.0',
      transform: () => {
        throw new Error('boom');
      },
    });
    registry.register(upperCase);

    const result = registry.run(makeDocument());
    expect(result.disabled).toEqual(['explodes']);
    expect(result.warnings[0]?.message).toContain('boom');
    // The healthy plugin still ran.
    const first = result.document.children[0];
    expect(first?.type === 'paragraph' && first.children[0]).toEqual({
      type: 'text',
      value: 'HELLO',
    });
    // Disabled plugins stay disabled on subsequent runs.
    expect(registry.isEnabled('explodes')).toBe(false);
    expect(registry.run(makeDocument()).disabled).toEqual([]);
  });

  it('discards in-place mutations when a plugin throws after editing its input', () => {
    const registry = new PluginRegistry();
    registry.register({
      id: 'mutator',
      name: 'Mutator',
      version: '1.0.0',
      transform: (document) => {
        (document.children as unknown as { type: string; children?: unknown }[])[0] = {
          type: 'paragraph',
          children: [{ type: 'text', value: 'CORRUPTED' }],
        };
        throw new Error('failed after mutate');
      },
    });
    const input = makeDocument();
    const result = registry.run(input);
    expect(result.disabled).toEqual(['mutator']);
    expect(result.document).toEqual(input);
  });

  it('discards changes from plugins that produce invalid nested nodes', () => {
    const registry = new PluginRegistry();
    registry.register({
      id: 'nested-bogus',
      name: 'Nested Bogus',
      version: '1.0.0',
      transform: (document) => ({
        ...document,
        children: [
          {
            type: 'quote',
            children: [{ type: 'paragraph', children: [{ type: 'bogus' }] as never }],
          },
        ],
      }),
    });
    const result = registry.run(makeDocument());
    expect(result.disabled).toEqual(['nested-bogus']);
    expect(result.document).toEqual(makeDocument());
  });

  it('discards changes from plugins that produce invalid documents', () => {
    const registry = new PluginRegistry();
    registry.register({
      id: 'corrupts',
      name: 'Corrupts',
      version: '1.0.0',
      transform: (document) => ({ ...document, children: [{ type: 'bogus' }] }) as never,
    });
    const result = registry.run(makeDocument());
    expect(result.disabled).toEqual(['corrupts']);
    expect(result.document).toEqual(makeDocument());
  });

  it('supports disabling and re-enabling plugins', () => {
    const registry = new PluginRegistry();
    registry.register(upperCase);
    registry.setEnabled('upper-case', false);
    const result = registry.run(makeDocument());
    expect(result.document).toEqual(makeDocument());
    registry.setEnabled('upper-case', true);
    expect(registry.isEnabled('upper-case')).toBe(true);
  });
});

describe('createCodeBlockPlugin', () => {
  it('rewrites matching code blocks and reports via context', () => {
    const plugin = createCodeBlockPlugin({
      id: 'mermaid',
      name: 'Mermaid Diagrams',
      version: '1.0.0',
      language: 'mermaid',
      transformBlock: (block, context) => {
        context.warn(`rendered diagram (${block.value.length} chars)`);
        return [
          {
            type: 'paragraph',
            children: [{ type: 'image', src: 'diagram.svg', alt: 'Diagram', title: null }],
          },
        ];
      },
    });
    const registry = new PluginRegistry();
    registry.register(plugin);

    const result = registry.run(makeDocument());
    expect(result.document.children).toHaveLength(2);
    const second = result.document.children[1];
    expect(second?.type).toBe('paragraph');
    expect(result.warnings[0]?.message).toContain('rendered diagram');
  });

  it('keeps non-matching blocks untouched', () => {
    const plugin = createCodeBlockPlugin({
      id: 'plantuml',
      name: 'PlantUML',
      version: '1.0.0',
      language: 'plantuml',
      transformBlock: () => [],
    });
    const registry = new PluginRegistry();
    registry.register(plugin);
    expect(registry.run(makeDocument()).document).toEqual(makeDocument());
  });
});
