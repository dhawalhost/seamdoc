import type { SdmInline, SdmBlock, SdmDocument } from '@seamdoc/semantic-model';
import { DEFAULT_DOCUMENT_METADATA } from '@seamdoc/shared';
import type { DocumentMetadata } from '@seamdoc/types';

function parseInlineAsciidoc(text: string): SdmInline[] {
  const result: SdmInline[] = [];
  let currentText = text;

  // Process bold: *text* -> strong
  // Process italic: _text_ -> emphasis
  // Process inline code: `text` -> inlineCode
  // Process links: http://link[text] -> link
  const boldRegex = /\*([^*]+)\*/;
  const italicRegex = /_([^_]+)_/;
  const codeRegex = /`([^`]+)`/;
  const linkRegex = /(https?:\/\/[^\s[]+)\[([^\]]*)\]/;

  while (currentText !== '') {
    const boldMatch = boldRegex.exec(currentText);
    const italicMatch = italicRegex.exec(currentText);
    const codeMatch = codeRegex.exec(currentText);
    const linkMatch = linkRegex.exec(currentText);

    // Find the earliest match
    const matches = [
      { type: 'bold', match: boldMatch },
      { type: 'italic', match: italicMatch },
      { type: 'code', match: codeMatch },
      { type: 'link', match: linkMatch },
    ].filter((m) => m.match !== null) as {
      type: string;
      match: RegExpExecArray;
    }[];

    if (matches.length === 0) {
      result.push({ type: 'text', value: currentText });
      break;
    }

    // Sort by match index
    matches.sort((a, b) => a.match.index - b.match.index);
    const earliest = matches[0]!;
    const index = earliest.match.index;

    if (index > 0) {
      result.push({ type: 'text', value: currentText.substring(0, index) });
    }

    const matchedText = earliest.match[0];
    if (earliest.type === 'bold') {
      result.push({
        type: 'strong',
        children: parseInlineAsciidoc(earliest.match[1]!),
      });
    } else if (earliest.type === 'italic') {
      result.push({
        type: 'emphasis',
        children: parseInlineAsciidoc(earliest.match[1]!),
      });
    } else if (earliest.type === 'code') {
      result.push({
        type: 'inlineCode',
        value: earliest.match[1]!,
      });
    } else if (earliest.type === 'link') {
      result.push({
        type: 'link',
        url: earliest.match[1]!,
        title: null,
        children: [{ type: 'text', value: earliest.match[2] || earliest.match[1]! }],
      });
    }

    currentText = currentText.substring(index + matchedText.length);
  }

  return result;
}

export function importAsciidocBlocks(content: string): SdmBlock[] {
  const blocks: SdmBlock[] = [];
  const lines = content.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!.trim();

    if (line === '') {
      i++;
      continue;
    }

    // 1. Heading: = Title, == Heading 1, etc.
    const headingMatch = /^(=+)\s+(.+)$/.exec(line);
    if (headingMatch) {
      const symbols = headingMatch[1]!.length;
      // Asciidoc maps '=' to H1 (document title), '==' to H2, '===' to H3, etc.
      // We map level = symbols (caps level between 1 and 6).
      const level = Math.min(6, Math.max(1, symbols)) as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({
        type: 'heading',
        level,
        children: parseInlineAsciidoc(headingMatch[2]!),
      });
      i++;
      continue;
    }

    // 2. Code Block: ----
    if (line === '----') {
      const codeLines: string[] = [];
      i++; // skip '----'
      while (i < lines.length && lines[i]!.trim() !== '----') {
        codeLines.push(lines[i]!);
        i++;
      }
      i++; // skip '----'
      // Try to read language from preceding line attribute e.g. [source,typescript]
      let language: string | null = null;
      if (blocks.length > 0) {
        // Lookback to check if previous block was parsed or attributes existed
        const prevLine = lines[i - codeLines.length - 3]?.trim() || '';
        const langMatch = /\[source\s*,\s*(\w+)\]/.exec(prevLine);
        if (langMatch) {
          language = langMatch[1]!;
        }
      }
      blocks.push({
        type: 'code',
        language,
        value: codeLines.join('\n'),
      });
      continue;
    }

    // 3. Blockquote: ____
    if (line === '____') {
      const quoteLines: string[] = [];
      i++; // skip '____'
      while (i < lines.length && lines[i]!.trim() !== '____') {
        quoteLines.push(lines[i]!);
        i++;
      }
      i++; // skip '____'
      blocks.push({
        type: 'quote',
        children: importAsciidocBlocks(quoteLines.join('\n')),
      });
      continue;
    }

    // 4. Divider: '''
    if (line === "'''") {
      blocks.push({
        type: 'thematicBreak',
      });
      i++;
      continue;
    }

    // 5. Image: image::src[alt]
    const imgMatch = /^image::([^[]+)\[([^\]]*)\]$/.exec(line);
    if (imgMatch) {
      blocks.push({
        type: 'paragraph',
        children: [
          {
            type: 'image',
            src: imgMatch[1]!.trim(),
            alt: imgMatch[2]!.trim(),
            title: null,
          },
        ],
      });
      i++;
      continue;
    }

    // 6. Bulleted List: * Item
    if (line.startsWith('* ')) {
      const items: { type: 'listItem'; children: SdmBlock[] }[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('* ')) {
        const itemLine = lines[i]!.trim();
        items.push({
          type: 'listItem' as const,
          children: [
            {
              type: 'paragraph' as const,
              children: parseInlineAsciidoc(itemLine.substring(2)),
            },
          ],
        });
        i++;
      }
      blocks.push({
        type: 'list',
        ordered: false,
        items,
      });
      continue;
    }

    // 7. Numbered List: . Item
    if (line.startsWith('. ')) {
      const items: { type: 'listItem'; children: SdmBlock[] }[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('. ')) {
        const itemLine = lines[i]!.trim();
        items.push({
          type: 'listItem' as const,
          children: [
            {
              type: 'paragraph' as const,
              children: parseInlineAsciidoc(itemLine.substring(2)),
            },
          ],
        });
        i++;
      }
      blocks.push({
        type: 'list',
        ordered: true,
        items,
      });
      continue;
    }

    // 8. Table: |===
    if (line === '|===') {
      i++; // skip '|==='
      const rowStrings: string[][] = [];
      while (i < lines.length && lines[i]!.trim() !== '|===') {
        const rowLine = lines[i]!.trim();
        if (rowLine.startsWith('|')) {
          // Split table cells by '|', filter out empty matches
          const cells = rowLine
            .split('|')
            .map((c) => c.trim())
            .filter((c, index) => index > 0 || c !== '');
          if (cells.length > 0) {
            rowStrings.push(cells);
          }
        }
        i++;
      }
      i++; // skip '|==='

      const rows = rowStrings.map((cells) => ({
        type: 'tableRow' as const,
        cells: cells.map((cellText) => ({
          type: 'tableCell' as const,
          children: parseInlineAsciidoc(cellText),
        })),
      }));

      // Assumes first row as header in Asciidoc tables by convention
      const headerRow = rows.length > 0 && rows[0] !== undefined ? rows[0] : null;
      const bodyRows = rows.length > 0 ? rows.slice(1) : [];

      const columnCount = Math.max(
        headerRow?.cells.length || 0,
        ...bodyRows.map((r) => r.cells.length),
        1,
      );
      const alignments = Array.from({ length: columnCount }, () => 'none' as const);

      blocks.push({
        type: 'table',
        alignments,
        header: headerRow,
        rows: bodyRows,
      });
      continue;
    }

    // 9. Standard Paragraph (consecutive non-empty, non-block lines)
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() !== '' &&
      !/^=+ /.test(lines[i]!.trim()) &&
      !lines[i]!.trim().startsWith('* ') &&
      !lines[i]!.trim().startsWith('. ') &&
      lines[i]!.trim() !== '----' &&
      lines[i]!.trim() !== '____' &&
      lines[i]!.trim() !== '|===' &&
      lines[i]!.trim() !== "'''" &&
      !/^image::/.test(lines[i]!.trim())
    ) {
      paragraphLines.push(lines[i]!.trim());
      i++;
    }
    blocks.push({
      type: 'paragraph',
      children: parseInlineAsciidoc(paragraphLines.join(' ')),
    });
  }

  return blocks;
}

export function importAsciidoc(content: string, metadata?: Partial<DocumentMetadata>): SdmDocument {
  return {
    type: 'document',
    version: 1,
    metadata: { ...DEFAULT_DOCUMENT_METADATA, ...metadata },
    children: importAsciidocBlocks(content),
  };
}
