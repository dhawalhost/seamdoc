import { parseMarkdown } from '@seamdoc/parser';
import { fromMdast } from '@seamdoc/semantic-model';
import type { SdmDocument } from '@seamdoc/semantic-model';
import { DEFAULT_DOCUMENT_METADATA } from '@seamdoc/shared';
import type { DocumentMetadata } from '@seamdoc/types';

export function importMdx(mdx: string, metadata?: Partial<DocumentMetadata>): SdmDocument {
  // Pre-process MDX: map custom component blocks (like Callout, Note, Alert)
  // to standard Markdown blockquotes (>), and strip general JSX elements.
  const processed = mdx
    .replace(/<Callout[^>]*>([\s\S]*?)<\/Callout>/gi, '\n> $1\n')
    .replace(/<Note[^>]*>([\s\S]*?)<\/Note>/gi, '\n> $1\n')
    .replace(/<Alert[^>]*>([\s\S]*?)<\/Alert>/gi, '\n> $1\n')
    // Strip self-closing JSX components (e.g. <Meta />, <Author name="John" />)
    .replace(/<[A-Z][a-zA-Z0-9]*\s*[^>]*\/>/g, '')
    // Strip remaining custom React wrapper tags
    .replace(/<\/?[A-Z][a-zA-Z0-9]*\s*[^>]*>/g, '');

  const ast = parseMarkdown(processed);
  return fromMdast(ast, { metadata: { ...DEFAULT_DOCUMENT_METADATA, ...metadata } });
}
