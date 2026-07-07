/**
 * Converts a Markdown AST (mdast) into the Semantic Document Model.
 * The SDM removes Markdown-specific concepts; renderers never see mdast.
 */

import type {
  AlignType,
  BlockContent,
  Blockquote,
  Code,
  DefinitionContent,
  Heading,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
  Table,
  TableRow,
} from '@seamdoc/ast';
import type { DocumentMetadata } from '@seamdoc/types';
import { DEFAULT_DOCUMENT_METADATA, SDM_VERSION } from '@seamdoc/shared';
import type {
  SdmBlock,
  SdmCellAlignment,
  SdmDocument,
  SdmInline,
  SdmListItem,
  SdmTableRow,
} from './nodes.js';

let inputCount = 0;

export function resetInputCounter(): void {
  inputCount = 0;
}

export function splitTextInputs(text: string): readonly SdmInline[] {
  const results: SdmInline[] = [];
  let lastIndex = 0;
  // Match unchecked checkbox [ ], checked checkbox [x]/[X], or text fields [___] (3 or more underscores)
  const regex = /\[(?:(\s)|([xX])|(_+))\]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      results.push({ type: 'text', value: text.substring(lastIndex, matchIndex) });
    }

    inputCount++;
    const name = `input_${inputCount}`;

    if (match[1] !== undefined) {
      results.push({ type: 'input', inputType: 'checkbox', name, checked: false });
    } else if (match[2] !== undefined) {
      results.push({ type: 'input', inputType: 'checkbox', name, checked: true });
    } else if (match[3] !== undefined) {
      const underscores = match[3];
      results.push({
        type: 'input',
        inputType: 'text',
        name,
        width: underscores.length,
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    results.push({ type: 'text', value: text.substring(lastIndex) });
  }

  return results;
}

export interface FromMdastOptions {
  readonly metadata?: Partial<DocumentMetadata>;
}

export function fromMdast(root: Root, options: FromMdastOptions = {}): SdmDocument {
  resetInputCounter();
  return {
    type: 'document',
    version: SDM_VERSION,
    metadata: { ...DEFAULT_DOCUMENT_METADATA, ...options.metadata },
    children: convertBlocks(root.children),
  };
}

function convertBlocks(nodes: readonly RootContent[]): readonly SdmBlock[] {
  const blocks: SdmBlock[] = [];
  for (const node of nodes) {
    const block = convertBlock(node);
    if (block !== null) {
      blocks.push(block);
    }
  }
  return blocks;
}

function convertBlock(node: RootContent): SdmBlock | null {
  switch (node.type) {
    case 'heading':
      return convertHeading(node);
    case 'paragraph':
      return convertParagraph(node);
    case 'code':
      return convertCode(node);
    case 'blockquote':
      return convertQuote(node);
    case 'thematicBreak':
      return { type: 'thematicBreak' };
    case 'list':
      return convertList(node);
    case 'table':
      return convertTable(node);
    case 'html': {
      const val = (node as { value?: string }).value || '';
      if (val.trim() === '<!-- pagebreak -->') {
        return { type: 'pageBreak' };
      }
      return null;
    }

    // Unsupported or non-content nodes are dropped; the pipeline degrades
    // gracefully rather than failing (docs/02-architecture/rendering-pipeline.md).
    default:
      return null;
  }
}

function convertHeading(node: Heading): SdmBlock {
  return {
    type: 'heading',
    level: node.depth,
    children: convertInlines(node.children),
  };
}

function convertParagraph(node: Paragraph): SdmBlock {
  return { type: 'paragraph', children: convertInlines(node.children) };
}

function convertCode(node: Code): SdmBlock {
  return { type: 'code', language: node.lang ?? null, value: node.value };
}

function convertQuote(node: Blockquote): SdmBlock {
  return {
    type: 'quote',
    children: convertBlocks(node.children),
  };
}

function convertList(node: List): SdmBlock {
  return {
    type: 'list',
    ordered: node.ordered === true,
    items: node.children.map(convertListItem),
  };
}

function convertListItem(node: ListItem): SdmListItem {
  return {
    type: 'listItem',
    children: convertBlocks(node.children as readonly (BlockContent | DefinitionContent)[]),
  };
}

function convertTable(node: Table): SdmBlock {
  const [headerRow, ...bodyRows] = node.children;
  return {
    type: 'table',
    alignments: (node.align ?? []).map(convertAlignment),
    header: headerRow === undefined ? null : convertTableRow(headerRow),
    rows: bodyRows.map(convertTableRow),
  };
}

function convertAlignment(align: AlignType): SdmCellAlignment {
  return align ?? 'none';
}

function convertTableRow(node: TableRow): SdmTableRow {
  return {
    type: 'tableRow',
    cells: node.children.map((cell) => ({
      type: 'tableCell',
      children: convertInlines(cell.children),
    })),
  };
}

function convertInlines(nodes: readonly PhrasingContent[]): readonly SdmInline[] {
  const inlines: SdmInline[] = [];
  for (const node of nodes) {
    inlines.push(...convertInline(node));
  }
  return inlines;
}

function convertInline(node: PhrasingContent): readonly SdmInline[] {
  switch (node.type) {
    case 'text':
      return splitTextInputs(node.value);
    case 'emphasis':
      return [{ type: 'emphasis', children: convertInlines(node.children) }];
    case 'strong':
      return [{ type: 'strong', children: convertInlines(node.children) }];
    case 'inlineCode':
      return [{ type: 'inlineCode', value: node.value }];
    case 'link':
      return [
        {
          type: 'link',
          url: node.url,
          title: node.title ?? null,
          children: convertInlines(node.children),
        },
      ];
    case 'break':
      return [{ type: 'lineBreak' }];
    case 'image':
      return [
        {
          type: 'image',
          src: node.url,
          alt: node.alt ?? '',
          title: node.title ?? null,
        },
      ];
    case 'delete':
      return convertInlines(node.children);
    default:
      return [];
  }
}
