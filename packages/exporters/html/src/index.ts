import { RENDER_TREE_VERSION } from '@seamdoc/shared';
import type { RenderDocument, RenderBlock, TextRun } from '@seamdoc/renderer';
import type { Exporter, ExportFormat, ExportResult, ExportSettings } from '@seamdoc/types';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function serializeRuns(runs: readonly TextRun[]): string {
  return runs
    .map((run) => {
      const styles = [
        `font-family: ${run.style.fontFamily}`,
        `font-size: ${run.style.fontSize}pt`,
        `font-weight: ${run.style.fontWeight}`,
        run.style.italic ? 'font-style: italic' : 'font-style: normal',
        `color: ${run.style.color}`,
        run.style.underline ? 'text-decoration: underline' : 'text-decoration: none',
      ].join('; ');
      const escapedText = escapeHtml(run.text);
      if (run.style.link !== '') {
        return `<a href="${run.style.link}" style="${styles}">${escapedText}</a>`;
      }
      return `<span style="${styles}">${escapedText}</span>`;
    })
    .join('');
}

function serializeBlock(block: RenderBlock): string {
  const spacing =
    block.type === 'table'
      ? 'margin-top: 0pt; margin-bottom: 0pt;'
      : `margin-top: ${block.spacing.before}pt; margin-bottom: ${block.spacing.after}pt;`;
  switch (block.type) {
    case 'heading':
      return `<div style="${spacing} text-align: ${block.alignment};"><h${block.level} style="margin: 0; padding: 0; font-size: inherit; font-weight: inherit;">${serializeRuns(block.runs)}</h${block.level}></div>`;
    case 'paragraph':
      return `<p style="${spacing} text-align: ${block.alignment}; line-height: ${block.lineHeight}; margin: 0; padding: 0;">${serializeRuns(block.runs)}</p>`;
    case 'codeBlock': {
      const codeHtml = block.lines
        .map((lineRuns) => {
          return `<span>${serializeRuns(lineRuns)}</span>`;
        })
        .join('\n');
      return `<pre style="${spacing} background: ${block.background}; padding: ${block.padding}pt; font-family: ${block.style.fontFamily}; font-size: ${block.style.fontSize}pt; color: ${block.style.color}; overflow-x: auto; margin: 0;"><code>${codeHtml}</code></pre>`;
    }
    case 'quote': {
      const innerHtml = block.children.map(serializeBlock).join('');
      return `<blockquote style="${spacing} border-left: ${block.borderWidth}pt solid ${block.borderColor}; padding-left: ${block.indent}pt; margin-left: 0; margin-right: 0;">${innerHtml}</blockquote>`;
    }
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      const itemsHtml = block.items
        .map((item) => {
          const itemChildren = item.children.map(serializeBlock).join('');
          return `<li>${itemChildren}</li>`;
        })
        .join('');
      return `<${Tag} style="${spacing} padding-left: ${block.indent}pt; margin-left: 0;">${itemsHtml}</${Tag}>`;
    }
    case 'table': {
      const rowsHtml = block.rows
        .map((row) => {
          const cellsHtml = row.cells
            .map((cell) => {
              const style = [
                `border: ${block.borderWidth}pt solid ${block.borderColor}`,
                `padding: ${block.cellPadding}pt`,
                `text-align: ${cell.alignment}`,
                cell.background !== '' ? `background: ${cell.background}` : '',
              ]
                .filter(Boolean)
                .join('; ');
              const Tag = row.header ? 'th' : 'td';
              return `<${Tag} style="${style}">${serializeRuns(cell.runs)}</${Tag}>`;
            })
            .join('');
          return `<tr>${cellsHtml}</tr>`;
        })
        .join('');
      return `<table style="border-collapse: collapse; width: 100%; border: ${block.borderWidth}pt solid ${block.borderColor};">${rowsHtml}</table>`;
    }
    case 'image':
      return `<div style="${spacing} text-align: ${block.alignment};"><img src="${block.src}" alt="${escapeHtml(block.alt)}" style="max-width: 100%; height: auto;" /></div>`;
    case 'rule':
      return `<hr style="${spacing} border: none; border-top: ${block.thickness}pt solid ${block.color};" />`;
    case 'columns': {
      const colsHtml = block.columns
        .map((col) => {
          const colStyle = `width: ${col.width}pt; display: inline-block; vertical-align: top;`;
          const innerHtml = col.children.map(serializeBlock).join('');
          return `<div style="${colStyle}">${innerHtml}</div>`;
        })
        .join('<div style="width: 12pt; display: inline-block;"></div>');
      return `<div style="${spacing} width: 100%; display: block; font-size: 0; box-sizing: border-box;">${colsHtml}</div>`;
    }
    default: {
      const exhaustive: never = block;
      throw new Error(`Unhandled block: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export class HtmlExporter implements Exporter<RenderDocument> {
  readonly id = 'html';
  readonly name = 'HTML Exporter';
  readonly version = '0.1.0';

  supports(format: ExportFormat): boolean {
    return format === 'html';
  }

  async export(document: RenderDocument, settings: ExportSettings): Promise<ExportResult> {
    if (document.version !== RENDER_TREE_VERSION) {
      throw new Error(
        `Unsupported render tree version ${document.version}; expected ${RENDER_TREE_VERSION}.`,
      );
    }

    const title = escapeHtml(settings.metadata.title || 'Untitled Document');
    const author = escapeHtml(settings.metadata.author || '');
    const description = escapeHtml(settings.metadata.description || '');

    const pagesHtml = document.pages
      .map((page, index) => {
        const pageStylesList = [
          `width: ${page.width}pt`,
          `min-height: ${page.height}pt`,
          `padding-top: ${page.margins.top}pt`,
          `padding-right: ${page.margins.right}pt`,
          `padding-bottom: ${page.margins.bottom}pt`,
          `padding-left: ${page.margins.left}pt`,
          `box-sizing: border-box`,
          `position: relative`,
        ];
        if (page.border !== null) {
          pageStylesList.push(
            `border: ${page.border.width}pt ${page.border.style} ${page.border.color}`,
          );
        }
        const pageStyles = pageStylesList.join('; ');

        const headerHtml =
          page.header !== null
            ? `<div class="page-header" style="color: ${page.header.style.color}; font-family: ${page.header.style.fontFamily}; font-size: ${page.header.style.fontSize}pt;">${escapeHtml(page.header.text)}</div>`
            : '';

        const footerText = page.footer !== null ? escapeHtml(page.footer.text) : '';
        const pageNum = page.footer?.pageNumbers ? ` ${index + 1}` : '';
        const footerHtml =
          page.footer !== null
            ? `<div class="page-footer" style="color: ${page.footer.style.color}; font-family: ${page.footer.style.fontFamily}; font-size: ${page.footer.style.fontSize}pt;">${footerText}${pageNum}</div>`
            : '';

        const contentHtml = page.children.map(serializeBlock).join('\n');

        return `
          <div class="page" id="page-${page.id}" style="${pageStyles}">
            ${headerHtml}
            <div class="page-content">
              ${contentHtml}
            </div>
            ${footerHtml}
          </div>
        `;
      })
      .join('\n');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="author" content="${author}">
  <meta name="description" content="${description}">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding-top: 24px;
      padding-bottom: 24px;
    }
    .page {
      background-color: #ffffff;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      position: relative;
    }
    .page-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 36pt;
      padding: 6pt 12pt;
      box-sizing: border-box;
    }
    .page-footer {
      position: absolute;
      bottom: 24pt;
      left: 0;
      right: 0;
      text-align: center;
    }
    a {
      color: inherit;
    }
    @media print {
      body {
        background-color: transparent;
        padding: 0;
        gap: 0;
      }
      .page {
        box-shadow: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;

    const encoder = new TextEncoder();
    const data = encoder.encode(html).buffer;

    const resolvedFilename = settings.filename.endsWith('.html')
      ? settings.filename
      : `${settings.filename}.html`;

    return {
      filename: resolvedFilename,
      mimeType: 'text/html',
      data,
    };
  }
}

export const htmlExporter = new HtmlExporter();
