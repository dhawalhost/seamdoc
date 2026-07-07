import { parse, HTMLElement, type Node } from 'node-html-parser';
import type { SdmInline, SdmBlock, SdmDocument } from '@seamdoc/semantic-model';
import { DEFAULT_DOCUMENT_METADATA } from '@seamdoc/shared';
import type { DocumentMetadata } from '@seamdoc/types';

function parseInlineNodes(nodes: Node[]): SdmInline[] {
  const result: SdmInline[] = [];
  for (const node of nodes) {
    if (node.nodeType === 3) {
      result.push({
        type: 'text',
        value: node.text,
      });
    } else if (node instanceof HTMLElement) {
      const tagName = node.tagName.toLowerCase();
      switch (tagName) {
        case 'strong':
        case 'b':
          result.push({
            type: 'strong',
            children: parseInlineNodes(node.childNodes),
          });
          break;
        case 'em':
        case 'i':
          result.push({
            type: 'emphasis',
            children: parseInlineNodes(node.childNodes),
          });
          break;
        case 'code':
          result.push({
            type: 'inlineCode',
            value: node.text,
          });
          break;
        case 'a':
          result.push({
            type: 'link',
            url: node.getAttribute('href') || '',
            title: node.getAttribute('title') || null,
            children: parseInlineNodes(node.childNodes),
          });
          break;
        case 'br':
          result.push({
            type: 'lineBreak',
          });
          break;
        case 'img':
          result.push({
            type: 'image',
            src: node.getAttribute('src') || '',
            alt: node.getAttribute('alt') || '',
            title: node.getAttribute('title') || null,
          });
          break;
        default:
          result.push(...parseInlineNodes(node.childNodes));
          break;
      }
    }
  }
  return result;
}

function parseBlockNodes(elements: Node[]): SdmBlock[] {
  const blocks: SdmBlock[] = [];
  for (const node of elements) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    const tagName = node.tagName.toLowerCase();

    switch (tagName) {
      case 'p':
        blocks.push({
          type: 'paragraph',
          children: parseInlineNodes(node.childNodes),
        });
        break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const level = parseInt(tagName.substring(1)) as 1 | 2 | 3 | 4 | 5 | 6;
        blocks.push({
          type: 'heading',
          level,
          children: parseInlineNodes(node.childNodes),
        });
        break;
      }
      case 'blockquote':
        blocks.push({
          type: 'quote',
          children: parseBlockNodes(node.childNodes),
        });
        break;
      case 'pre': {
        const codeElement = node.querySelector('code');
        const value = codeElement ? codeElement.text : node.text;
        const languageClass = codeElement?.getAttribute('class') || '';
        const match = /language-(\w+)/.exec(languageClass);
        const language = match ? match[1]! : null;
        blocks.push({
          type: 'code',
          language,
          value,
        });
        break;
      }
      case 'ul':
      case 'ol': {
        const ordered = tagName === 'ol';
        const itemElements = node.querySelectorAll('li');
        const items = itemElements.map((li) => {
          const sdmChildren = parseBlockNodes(li.childNodes);
          return {
            type: 'listItem' as const,
            children:
              sdmChildren.length > 0
                ? sdmChildren
                : [
                    {
                      type: 'paragraph' as const,
                      children: parseInlineNodes(li.childNodes),
                    },
                  ],
          };
        });
        blocks.push({
          type: 'list',
          ordered,
          items,
        });
        break;
      }
      case 'table': {
        const rowElements = node.querySelectorAll('tr');
        const rows = rowElements.map((tr) => ({
          type: 'tableRow' as const,
          cells: tr.querySelectorAll('td, th').map((cell) => ({
            type: 'tableCell' as const,
            children: parseInlineNodes(cell.childNodes),
          })),
        }));

        const thead = node.querySelector('thead');
        const headerRow = thead
          ? thead.querySelector('tr')
          : rowElements[0]?.querySelector('th')
            ? rowElements[0]
            : null;

        let headerSdm = null;
        let bodySdm = rows;
        if (headerRow) {
          headerSdm = {
            type: 'tableRow' as const,
            cells: headerRow.querySelectorAll('td, th').map((cell) => ({
              type: 'tableCell' as const,
              children: parseInlineNodes(cell.childNodes),
            })),
          };
          bodySdm = rows.slice(1);
        }

        const columnCount = Math.max(
          headerSdm?.cells.length || 0,
          ...bodySdm.map((r) => r.cells.length),
          1,
        );
        const alignments = Array.from({ length: columnCount }, () => 'none' as const);

        blocks.push({
          type: 'table',
          alignments,
          header: headerSdm,
          rows: bodySdm,
        });
        break;
      }
      case 'hr':
        blocks.push({
          type: 'thematicBreak',
        });
        break;
      case 'img':
        blocks.push({
          type: 'paragraph',
          children: [
            {
              type: 'image',
              src: node.getAttribute('src') || '',
              alt: node.getAttribute('alt') || '',
              title: node.getAttribute('title') || null,
            },
          ],
        });
        break;
      default:
        blocks.push(...parseBlockNodes(node.childNodes));
        break;
    }
  }
  return blocks;
}

export function importHtml(html: string, metadata?: Partial<DocumentMetadata>): SdmDocument {
  const root = parse(html);
  const body = root.querySelector('body') || root;
  const children = parseBlockNodes(body.childNodes);
  return {
    type: 'document',
    version: 1,
    metadata: { ...DEFAULT_DOCUMENT_METADATA, ...metadata },
    children,
  };
}
