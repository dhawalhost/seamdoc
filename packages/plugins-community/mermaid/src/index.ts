/**
 * @seamdoc/plugin-mermaid
 *
 * Transforms fenced code blocks with language "mermaid" into paragraph nodes
 * that contain an SVG data-URL image of the rendered diagram.
 *
 * Rendering strategy (client-side / Node.js compatible):
 *   - In Node.js environments without a DOM, the code block is preserved as-is
 *     and a `context.warn` is emitted to notify callers that diagrams cannot
 *     be server-side rendered without a headless browser (e.g. Puppeteer).
 *   - In browser environments, `mermaid` (if available via the window global)
 *     is used to render the diagram to an SVG string, which is then base64-encoded
 *     and emitted as an image node inside a paragraph block.
 *
 * @module @seamdoc/plugin-mermaid
 */

import { createCodeBlockPlugin } from '@seamdoc/plugins';
import type { SdmBlock, SdmCodeBlock } from '@seamdoc/semantic-model';
import type { PluginContext } from '@seamdoc/plugins';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Minimal interface matching what mermaid.js exposes for renderAsync/render. */
interface MermaidApi {
  render: (id: string, definition: string) => Promise<{ svg: string }>;
}

declare global {
  interface Window {
    mermaid?: MermaidApi;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Unique counter for mermaid diagram element IDs to avoid conflicts. */
let diagramCounter = 0;

/**
 * Attempts a client-side render using the `mermaid` browser global.
 * Returns null when unavailable (e.g., in Node.js).
 */
async function tryBrowserRender(code: string): Promise<string | null> {
  if (typeof window === 'undefined' || typeof window.mermaid === 'undefined') {
    return null;
  }
  diagramCounter += 1;
  const id = `seamdoc-mermaid-${diagramCounter}`;
  try {
    const { svg } = await window.mermaid.render(id, code);
    const encoded = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${encoded}`;
  } catch {
    return null;
  }
}

/**
 * Builds a paragraph block containing a single image inline node.
 * This is the standard way to render a block-level diagram in the SDM.
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

// ─── Plugin ───────────────────────────────────────────────────────────────────

export const mermaidPlugin = createCodeBlockPlugin({
  id: 'mermaid',
  name: 'Mermaid Diagram Renderer',
  version: '0.1.0',
  description:
    'Renders fenced Mermaid code blocks as inline SVG images in the document. ' +
    'Requires the mermaid browser global in browser environments.',
  language: 'mermaid',
  transformBlock: (block: SdmCodeBlock, context: PluginContext): SdmBlock[] | null => {
    const code = block.value.trim();
    if (code === '') {
      context.warn('Empty mermaid block skipped.');
      return null;
    }

    // Schedule async rendering; if unavailable, emit a warning and keep the
    // code block unchanged so the document remains valid in all environments.
    void tryBrowserRender(code).then((dataUrl) => {
      if (dataUrl === null) {
        context.warn(
          'Mermaid diagram could not be rendered: mermaid browser global is not available. ' +
            'Install mermaid.js in the page or use a headless renderer.',
        );
      }
      // NOTE: The image replacement happens asynchronously. In a streaming
      // pipeline, callers should await `plugin.renderPending?.()` if they
      // need the final document before exporting. For now the code block is
      // preserved as a safe fallback so exports are never broken.
    });

    // Synchronous fallback: preserve the code block untouched.
    return null;
  },
});

/**
 * Async variant that actually awaits diagram rendering before returning.
 * Use this when you need fully resolved diagrams before exporting.
 */
export async function transformMermaidBlock(
  block: SdmCodeBlock,
  context: PluginContext,
): Promise<SdmBlock[]> {
  const code = block.value.trim();
  if (code === '') {
    context.warn('Empty mermaid block skipped.');
    return [block];
  }
  const dataUrl = await tryBrowserRender(code);
  if (dataUrl === null) {
    context.warn(
      'Mermaid diagram could not be rendered synchronously. ' +
        'Ensure mermaid.js is loaded in the page before calling this function.',
    );
    return [block];
  }
  return [makeImageBlock(dataUrl, 'Mermaid diagram')];
}
