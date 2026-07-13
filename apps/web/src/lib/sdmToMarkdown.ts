import type { SdmDocument, SdmBlock, SdmInline } from '@seamdoc/semantic-model';

export function sdmInlineToMarkdown(node: SdmInline): string {
  switch (node.type) {
    case 'text':
      return node.value;
    case 'emphasis':
      return `*${node.children.map(sdmInlineToMarkdown).join('')}*`;
    case 'strong':
      return `**${node.children.map(sdmInlineToMarkdown).join('')}**`;
    case 'inlineCode':
      return `\`${node.value}\``;
    case 'link':
      return `[${node.children.map(sdmInlineToMarkdown).join('')}](${node.url})`;
    case 'lineBreak':
      return '\n';
    case 'image':
      return `![${node.alt}](${node.src})`;
    case 'input':
      if (node.inputType === 'checkbox') {
        return node.checked ? '[x]' : '[ ]';
      } else {
        return `[${'_'.repeat(node.width || 3)}]`;
      }
    default:
      return '';
  }
}

export function sdmBlockToMarkdown(block: SdmBlock): string {
  switch (block.type) {
    case 'heading': {
      const prefix = '#'.repeat(block.level);
      return `${prefix} ${block.children.map(sdmInlineToMarkdown).join('')}`;
    }
    case 'paragraph':
      return block.children.map(sdmInlineToMarkdown).join('');
    case 'code':
      return `\`\`\`${block.language || ''}\n${block.value}\n\`\`\``;
    case 'quote':
      return block.children
        .map(sdmBlockToMarkdown)
        .map((line) =>
          line
            .split('\n')
            .map((l) => `> ${l}`)
            .join('\n'),
        )
        .join('\n\n');
    case 'thematicBreak':
      return '---';
    case 'pageBreak':
      return '<!-- pagebreak -->';
    case 'list': {
      return block.items
        .map((item, idx) => {
          const marker = block.ordered ? `${idx + 1}. ` : '- ';
          const content = item.children.map(sdmBlockToMarkdown).join('\n\n');
          return `${marker}${content}`;
        })
        .join('\n');
    }
    case 'table': {
      const colCount = block.alignments.length;
      const headers = block.header
        ? block.header.cells.map((c) => c.children.map(sdmInlineToMarkdown).join('')).join(' | ')
        : Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`).join(' | ');

      const alignments = block.alignments
        .map((align) => {
          if (align === 'left') return ':---';
          if (align === 'right') return '---:';
          if (align === 'center') return ':---:';
          return '---';
        })
        .join(' | ');

      const rows = block.rows
        .map((row) =>
          row.cells.map((c) => c.children.map(sdmInlineToMarkdown).join('')).join(' | '),
        )
        .join('\n');

      return `| ${headers} |\n| ${alignments} |\n${rows ? `| ${rows.replace(/\n/g, ' |\n| ')} |` : ''}`;
    }
    default:
      return '';
  }
}

export function sdmToMarkdown(doc: SdmDocument): string {
  return doc.children.map(sdmBlockToMarkdown).filter(Boolean).join('\n\n');
}
