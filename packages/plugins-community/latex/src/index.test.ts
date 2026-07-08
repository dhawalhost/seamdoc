import { describe, it, expect } from 'vitest';
import { latexPlugin, latexAltPlugin, transformBlock } from './index.js';
import { PluginRegistry } from '@seamdoc/plugins';
import type { SdmCodeBlock, SdmDocument } from '@seamdoc/semantic-model';

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

describe('latexPlugin', () => {
  it('has the correct plugin id and version', () => {
    expect(latexPlugin.id).toBe('latex');
    expect(latexPlugin.version).toBe('0.1.0');
  });

  it('latexAltPlugin has a different id', () => {
    expect(latexAltPlugin.id).toBe('latex-alt');
  });

  it('can be registered in PluginRegistry without error', () => {
    const registry = new PluginRegistry();
    expect(() => registry.register(latexPlugin)).not.toThrow();
    expect(registry.isEnabled('latex')).toBe(true);
  });

  it('passes non-math code blocks through unchanged', () => {
    const registry = new PluginRegistry();
    registry.register(latexPlugin);

    const doc: SdmDocument = {
      ...BASE_DOCUMENT,
      children: [
        {
          type: 'code',
          language: 'python',
          value: 'print("hello")',
          meta: null,
        },
      ],
    };

    const result = registry.run(doc);
    expect(result.document.children).toHaveLength(1);
    expect(result.document.children[0]?.type).toBe('code');
  });

  it('renders a valid LaTeX expression into a paragraph image block', () => {
    const warnings: string[] = [];
    const context = { warn: (m: string) => warnings.push(m) };

    const block: SdmCodeBlock = {
      type: 'code',
      language: 'math',
      value: 'E = mc^2',
    };

    const result = transformBlock(block, context);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result?.[0]?.type).toBe('paragraph');

    // Paragraph should contain an image child with a data URL
    const para = result?.[0] as { type: 'paragraph'; children: unknown[] };
    const img = para.children[0] as { type: string; src: string };
    expect(img.type).toBe('image');
    expect(img.src).toMatch(/^data:image\/svg\+xml;base64,/);

    expect(warnings).toHaveLength(0);
  });

  it('emits a warning and preserves block for invalid LaTeX', () => {
    const warnings: string[] = [];
    const context = { warn: (m: string) => warnings.push(m) };

    const block: SdmCodeBlock = {
      type: 'code',
      language: 'math',
      value: '\\invalidcommand{',
    };

    const result = transformBlock(block, context);
    // Returns null (preserve original block) and emits a warning
    expect(result).toBeNull();
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('emits a warning and skips empty math blocks', () => {
    const warnings: string[] = [];
    const context = { warn: (m: string) => warnings.push(m) };

    const block: SdmCodeBlock = {
      type: 'code',
      language: 'math',
      value: '   ',
    };

    const result = transformBlock(block, context);
    expect(result).toBeNull();
    expect(warnings.some((w) => w.includes('Empty'))).toBe(true);
  });

  it('handles "latex" and "tex" language identifiers', () => {
    const warnings: string[] = [];
    const context = { warn: (m: string) => warnings.push(m) };

    for (const lang of ['latex', 'tex'] as const) {
      const block: SdmCodeBlock = {
        type: 'code',
        language: lang,
        value: 'x^2 + y^2 = r^2',
      };
      const result = transformBlock(block, context);
      expect(result).not.toBeNull();
      expect(result?.[0]?.type).toBe('paragraph');
    }
  });
});
