/**
 * Multi-format file importer for the web app.
 * Converts uploaded files to Markdown using @seamdoc/importers before
 * loading into the editor.
 */

import { importHtml, importMdx, importAsciidoc } from '@seamdoc/importers';
import { DEFAULT_DOCUMENT_METADATA } from '@seamdoc/shared';
import type { SdmBlock, SdmInline } from '@seamdoc/semantic-model';

export type ImportableFormat = 'markdown' | 'html' | 'mdx' | 'asciidoc';

export interface ImportResult {
  readonly markdown: string;
  readonly format: ImportableFormat;
  readonly filename: string;
}

export interface ImportError {
  readonly message: string;
}

const EXT_FORMAT_MAP: Record<string, ImportableFormat> = {
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.mdx': 'mdx',
  '.html': 'html',
  '.htm': 'html',
  '.adoc': 'asciidoc',
  '.asciidoc': 'asciidoc',
  '.asc': 'asciidoc',
};

export function detectFormat(filename: string): ImportableFormat | null {
  const lower = filename.toLowerCase();
  for (const [ext, format] of Object.entries(EXT_FORMAT_MAP)) {
    if (lower.endsWith(ext)) return format;
  }
  return null;
}

export function isSupportedFile(filename: string): boolean {
  return detectFormat(filename) !== null;
}

export const ACCEPTED_EXTENSIONS = Object.keys(EXT_FORMAT_MAP).join(',');
export const FORMAT_LABELS: Record<ImportableFormat, string> = {
  markdown: 'Markdown (.md)',
  mdx: 'MDX (.mdx)',
  html: 'HTML (.html)',
  asciidoc: 'AsciiDoc (.adoc)',
};

function extractText(node: SdmInline): string {
  if (node.type === 'text' || node.type === 'inlineCode') {
    return node.value;
  }
  if (node.type === 'image') {
    return node.alt;
  }
  if ('children' in node && node.children !== undefined) {
    return node.children.map(extractText).join('');
  }
  return '';
}

function reconstructBlockMarkdown(block: SdmBlock): string {
  if (block.type === 'paragraph') {
    return block.children.map(extractText).join('');
  }
  if (block.type === 'heading') {
    const prefix = '#'.repeat(block.level);
    return `${prefix} ${block.children.map(extractText).join('')}`;
  }
  return '';
}

/**
 * Reads a File and converts it to Markdown string.
 * Markdown files are returned as-is; other formats go through their
 * respective importers which convert to the SeamDoc IR then back to
 * a plain Markdown-compatible structure via the block content.
 */
export async function importFile(file: File): Promise<ImportResult> {
  const format = detectFormat(file.name);
  if (format === null) {
    throw new Error(
      `Unsupported file type: "${file.name}". Supported: ${Object.keys(EXT_FORMAT_MAP).join(', ')}`,
    );
  }

  const text = await file.text();
  const metadata = { ...DEFAULT_DOCUMENT_METADATA, title: file.name.replace(/\.[^.]+$/, '') };

  switch (format) {
    case 'markdown':
      return { markdown: text, format, filename: file.name };

    case 'mdx': {
      const doc = importMdx(text, metadata);
      const md = doc.children.map(reconstructBlockMarkdown).filter(Boolean).join('\n\n');
      return { markdown: md || text, format, filename: file.name };
    }

    case 'html': {
      const doc = importHtml(text, metadata);
      const md = doc.children.map(reconstructBlockMarkdown).filter(Boolean).join('\n\n');
      return { markdown: md || text, format, filename: file.name };
    }

    case 'asciidoc': {
      const doc = importAsciidoc(text, metadata);
      const md = doc.children.map(reconstructBlockMarkdown).filter(Boolean).join('\n\n');
      return { markdown: md || text, format, filename: file.name };
    }
  }
}
