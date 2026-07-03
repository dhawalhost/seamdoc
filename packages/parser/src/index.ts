/**
 * Markdown parser (docs/02-architecture/rendering-pipeline.md, Stage 2).
 * Converts Markdown text into an mdast tree. Contains no presentation logic.
 */

import type { Root } from 'mdast';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';

const processor = remark().use(remarkGfm);

export function parseMarkdown(markdown: string): Root {
  return processor.parse(markdown);
}

export type { Root as MarkdownAst } from 'mdast';
