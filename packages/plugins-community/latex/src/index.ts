/**
 * @seamdoc/plugin-latex
 *
 * Transforms LaTeX math expressions in the Semantic Document Model (SDM) into
 * KaTeX-rendered SVG image nodes.
 *
 * Supported notation:
 *   • Block math:  ```math ... ``` fenced code blocks with language "math" or "latex"
 *   • Inline math: Not handled at the SDM level (inline transforms operate on
 *     the markdown source; use the importHook for that use-case).
 *
 * The plugin uses `katex` which runs natively in both Node.js and browser
 * environments — no Chromium required.
 *
 * @module @seamdoc/plugin-latex
 */

import katex from 'katex';
import { createCodeBlockPlugin } from '@seamdoc/plugins';
import type { SdmBlock, SdmCodeBlock } from '@seamdoc/semantic-model';
import type { PluginContext } from '@seamdoc/plugins';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Languages treated as LaTeX/math by this plugin. */
const MATH_LANGUAGES = new Set(['math', 'latex', 'tex']);

/**
 * Renders a LaTeX expression to an SVG data URL using KaTeX.
 * Returns null when rendering fails (bad LaTeX syntax, etc.).
 */
function renderToSvgDataUrl(expression: string, displayMode: boolean): string | null {
  try {
    const svg = katex.renderToString(expression, {
      displayMode,
      throwOnError: true,
      output: 'html',
    });
    // Use Buffer when available (Node.js), fall back to btoa for browsers.
    const encoded =
      typeof Buffer !== 'undefined'
        ? Buffer.from(svg, 'utf8').toString('base64')
        : btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${encoded}`;
  } catch {
    return null;
  }
}

/**
 * Builds a paragraph block containing a single image inline node.
 * This wraps the SVG in a block-level container matching the SDM schema.
 */
function makeImageBlock(src: string, alt: string): SdmBlock {
  return {
    type: 'paragraph',
    children: [
      {
        type: 'image',
        src,
        alt,
        title: null,
      },
    ],
  };
}

// ─── Core transform ──────────────────────────────────────────────────────────

function transformLatexBlock(block: SdmCodeBlock, context: PluginContext): SdmBlock[] | null {
  const expression = block.value.trim();

  if (expression === '') {
    context.warn('Empty LaTeX block skipped.');
    return null;
  }

  const dataUrl = renderToSvgDataUrl(expression, /* displayMode */ true);
  if (dataUrl === null) {
    context.warn(
      `LaTeX rendering failed for expression starting with: "${expression.slice(0, 60)}". ` +
        'The code block will be preserved unchanged.',
    );
    return null; // preserve original block
  }

  return [makeImageBlock(dataUrl, `LaTeX: ${expression.slice(0, 80)}`)];
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

/**
 * Generic block transform that handles all supported math language identifiers.
 * Used internally by the plugin; also exported for direct use in pipelines.
 */
export function transformBlock(block: SdmCodeBlock, context: PluginContext): SdmBlock[] | null {
  if (!MATH_LANGUAGES.has(block.language ?? '')) {
    return null; // not a math block — fall through
  }
  return transformLatexBlock(block, context);
}

export const latexPlugin = createCodeBlockPlugin({
  id: 'latex',
  name: 'LaTeX Math Renderer',
  version: '0.1.0',
  description:
    'Renders fenced math/latex/tex code blocks as KaTeX SVG images. ' +
    'Works in Node.js and browser environments — no Chromium required.',
  language: 'math', // primary trigger language
  transformBlock,
});

/**
 * A variant plugin pre-configured for "latex" fenced blocks.
 * Register either `latexPlugin` or `latexAltPlugin` (or both) depending on
 * which fence language your users prefer.
 */
export const latexAltPlugin = createCodeBlockPlugin({
  id: 'latex-alt',
  name: 'LaTeX Math Renderer (latex/tex variant)',
  version: '0.1.0',
  description: 'Handles fenced blocks with language "latex" or "tex" in addition to "math".',
  language: 'latex',
  transformBlock,
});
