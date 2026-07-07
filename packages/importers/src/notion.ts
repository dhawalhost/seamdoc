import type { SdmInline, SdmBlock, SdmDocument } from '@seamdoc/semantic-model';
import { DEFAULT_DOCUMENT_METADATA } from '@seamdoc/shared';
import type { DocumentMetadata } from '@seamdoc/types';

function getNestedRecord(obj: unknown, key: string): Record<string, unknown> | undefined {
  if (obj && typeof obj === 'object' && key in obj) {
    const val = (obj as Record<string, unknown>)[key];
    if (val && typeof val === 'object' && val !== null) {
      return val as Record<string, unknown>;
    }
  }
  return undefined;
}

function getNestedArray(obj: unknown, key: string): unknown[] | undefined {
  if (obj && typeof obj === 'object' && key in obj) {
    const val = (obj as Record<string, unknown>)[key];
    if (Array.isArray(val)) {
      return val;
    }
  }
  return undefined;
}

function getNestedString(obj: unknown, key: string): string | undefined {
  if (obj && typeof obj === 'object' && key in obj) {
    const val = (obj as Record<string, unknown>)[key];
    if (typeof val === 'string') {
      return val;
    }
  }
  return undefined;
}

function parseRichText(richText: Record<string, unknown>[] | undefined): SdmInline[] {
  if (!richText) {
    return [];
  }
  return richText.map((item) => {
    let node: SdmInline = {
      type: 'text',
      value: (item.plain_text as string) || '',
    };

    const annotations = getNestedRecord(item, 'annotations');
    if (annotations) {
      if (annotations.bold) {
        node = {
          type: 'strong',
          children: [node],
        };
      }
      if (annotations.italic) {
        node = {
          type: 'emphasis',
          children: [node],
        };
      }
      if (annotations.code) {
        node = {
          type: 'inlineCode',
          value: (item.plain_text as string) || '',
        };
      }
    }

    if (item.href) {
      node = {
        type: 'link',
        url: item.href as string,
        title: null,
        children: [node],
      };
    }

    return node;
  });
}

export function importNotionBlocks(blocks: Record<string, unknown>[]): SdmBlock[] {
  const sdmBlocks: SdmBlock[] = [];
  let currentList: { ordered: boolean; items: Record<string, unknown>[] } | null = null;

  const flushList = () => {
    if (currentList) {
      sdmBlocks.push({
        type: 'list',
        ordered: currentList.ordered,
        items: currentList.items.map((item) => {
          const type = currentList!.ordered ? 'numbered_list_item' : 'bulleted_list_item';
          const typeObj = getNestedRecord(item, type);
          const richText = getNestedArray(typeObj, 'rich_text') as
            Record<string, unknown>[] | undefined;
          const children = parseRichText(richText);
          return {
            type: 'listItem' as const,
            children: [
              {
                type: 'paragraph' as const,
                children,
              },
            ],
          };
        }),
      });
      currentList = null;
    }
  };

  for (const block of blocks) {
    const type = block.type as string;

    if (type === 'bulleted_list_item' || type === 'numbered_list_item') {
      const ordered = type === 'numbered_list_item';
      if (currentList && currentList.ordered === ordered) {
        currentList.items.push(block);
      } else {
        flushList();
        currentList = { ordered, items: [block] };
      }
      continue;
    }

    flushList();

    switch (type) {
      case 'paragraph': {
        const paragraph = getNestedRecord(block, 'paragraph');
        const richText = getNestedArray(paragraph, 'rich_text') as
          Record<string, unknown>[] | undefined;
        sdmBlocks.push({
          type: 'paragraph',
          children: parseRichText(richText),
        });
        break;
      }
      case 'heading_1': {
        const heading = getNestedRecord(block, 'heading_1');
        const richText = getNestedArray(heading, 'rich_text') as
          Record<string, unknown>[] | undefined;
        sdmBlocks.push({
          type: 'heading',
          level: 1,
          children: parseRichText(richText),
        });
        break;
      }
      case 'heading_2': {
        const heading = getNestedRecord(block, 'heading_2');
        const richText = getNestedArray(heading, 'rich_text') as
          Record<string, unknown>[] | undefined;
        sdmBlocks.push({
          type: 'heading',
          level: 2,
          children: parseRichText(richText),
        });
        break;
      }
      case 'heading_3': {
        const heading = getNestedRecord(block, 'heading_3');
        const richText = getNestedArray(heading, 'rich_text') as
          Record<string, unknown>[] | undefined;
        sdmBlocks.push({
          type: 'heading',
          level: 3,
          children: parseRichText(richText),
        });
        break;
      }
      case 'quote': {
        const quote = getNestedRecord(block, 'quote');
        const richText = getNestedArray(quote, 'rich_text') as
          Record<string, unknown>[] | undefined;
        sdmBlocks.push({
          type: 'quote',
          children: [
            {
              type: 'paragraph',
              children: parseRichText(richText),
            },
          ],
        });
        break;
      }
      case 'code': {
        const code = getNestedRecord(block, 'code');
        const language = getNestedString(code, 'language') || null;
        const richText = getNestedArray(code, 'rich_text') as Record<string, unknown>[] | undefined;
        const value = richText?.map((t) => (t.plain_text as string) || '').join('') || '';
        sdmBlocks.push({
          type: 'code',
          language,
          value,
        });
        break;
      }
      case 'divider':
        sdmBlocks.push({
          type: 'thematicBreak',
        });
        break;
      case 'image': {
        const image = getNestedRecord(block, 'image');
        const file = getNestedRecord(image, 'file');
        const external = getNestedRecord(image, 'external');
        const src = (getNestedString(file, 'url') ||
          getNestedString(external, 'url') ||
          '') as string;
        const captionArray = getNestedArray(image, 'caption') as
          Record<string, unknown>[] | undefined;
        const caption = captionArray?.map((t) => (t.plain_text as string) || '').join('') || '';
        sdmBlocks.push({
          type: 'paragraph',
          children: [
            {
              type: 'image',
              src,
              alt: caption,
              title: null,
            },
          ],
        });
        break;
      }
      case 'table': {
        const table = getNestedRecord(block, 'table');
        const width = (table?.table_width as number) || 1;
        const alignments = Array.from({ length: width }, () => 'none' as const);
        const rowsArray = (getNestedArray(table, 'rows') || []) as Record<string, unknown>[];
        const rows = rowsArray.map((row) => {
          const cellsArray = (getNestedArray(row, 'cells') || []) as Record<string, unknown>[][];
          return {
            type: 'tableRow' as const,
            cells: cellsArray.map((cellTextArray) => ({
              type: 'tableCell' as const,
              children: parseRichText(cellTextArray),
            })),
          };
        });

        const hasHeader = (table?.has_row_header as boolean) || false;
        const headerRow = hasHeader && rows.length > 0 && rows[0] !== undefined ? rows[0] : null;
        const bodyRows = hasHeader && rows.length > 0 ? rows.slice(1) : rows;

        sdmBlocks.push({
          type: 'table',
          alignments,
          header: headerRow,
          rows: bodyRows,
        });
        break;
      }
    }
  }

  flushList();
  return sdmBlocks;
}

export function importNotion(
  blocks: Record<string, unknown>[],
  metadata?: Partial<DocumentMetadata>,
): SdmDocument {
  return {
    type: 'document',
    version: 1,
    metadata: { ...DEFAULT_DOCUMENT_METADATA, ...metadata },
    children: importNotionBlocks(blocks),
  };
}
