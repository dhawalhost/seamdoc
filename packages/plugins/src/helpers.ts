/**
 * Authoring helpers for common plugin shapes, e.g. the docs' canonical
 * example of turning fenced code blocks into other nodes (Mermaid → image).
 */

import type { SdmBlock, SdmCodeBlock, SdmDocument } from '@seamdoc/semantic-model';
import type { PluginContext, SeamdocPlugin } from './types.js';

/** Identity helper that preserves the exact plugin type. */
export function definePlugin(plugin: SeamdocPlugin): SeamdocPlugin {
  return plugin;
}

export interface CodeBlockPluginOptions {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  /** Fence language this plugin consumes (e.g. "mermaid"). */
  readonly language: string;
  /**
   * Maps a matching code block to replacement blocks. Returning null keeps
   * the block unchanged.
   */
  readonly transformBlock: (block: SdmCodeBlock, context: PluginContext) => SdmBlock[] | null;
}

/** Builds a plugin that rewrites fenced code blocks of a given language. */
export function createCodeBlockPlugin(options: CodeBlockPluginOptions): SeamdocPlugin {
  const transform = (document: SdmDocument, context: PluginContext): SdmDocument => {
    const children = document.children.flatMap((block): SdmBlock[] => {
      if (block.type === 'code' && block.language === options.language) {
        return options.transformBlock(block, context) ?? [block];
      }
      return [block];
    });
    return { ...document, children };
  };

  return {
    id: options.id,
    name: options.name,
    version: options.version,
    ...(options.description === undefined ? {} : { description: options.description }),
    transform,
  };
}
