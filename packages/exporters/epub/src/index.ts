import { strToU8, zipSync } from 'fflate';
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
    case 'pageBreak':
      return '';
    default: {
      const exhaustive: never = block;
      throw new Error(`Unhandled block: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export class EpubExporter implements Exporter<RenderDocument> {
  readonly id = 'epub';
  readonly name = 'EPUB Exporter';
  readonly version = '0.1.0';

  supports(format: ExportFormat): boolean {
    return format === 'epub';
  }

  async export(document: RenderDocument, settings: ExportSettings): Promise<ExportResult> {
    if (document.version !== RENDER_TREE_VERSION) {
      throw new Error(
        `Unsupported render tree version ${document.version}; expected ${RENDER_TREE_VERSION}.`,
      );
    }

    const title = settings.metadata.title || 'Untitled Book';
    const author = settings.metadata.author || 'Unknown Author';
    const description = settings.metadata.description || '';
    const language = settings.metadata.language || 'en';
    const modifiedDate = new Date().toISOString().split('.')[0] + 'Z'; // UTC modified date formatted correctly for Dublin Core term

    const files: Record<string, Uint8Array | [Uint8Array, { level: 0 }]> = {};

    // 1. mimetype (first entry, uncompressed)
    files['mimetype'] = [strToU8('application/epub+zip'), { level: 0 as const }];

    // 2. META-INF/container.xml
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    files['META-INF/container.xml'] = strToU8(containerXml);

    // 3. OEBPS/styles.css
    const css = `
body {
  margin: 10%;
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.5;
}
.page-header {
  border-bottom: 1px solid #ccc;
  padding-bottom: 5px;
  margin-bottom: 20px;
  font-size: 0.9em;
}
.page-footer {
  border-top: 1px solid #ccc;
  padding-top: 5px;
  margin-top: 20px;
  font-size: 0.9em;
  text-align: center;
}
img {
  max-width: 100%;
  height: auto;
}
`;
    files['OEBPS/styles.css'] = strToU8(css);

    // 4. XHTML Pages
    const manifestItems: string[] = [];
    const spineItems: string[] = [];
    const navLinks: string[] = [];

    document.pages.forEach((page, index) => {
      const pageId = `page-${index + 1}`;
      const pageFilename = `${pageId}.xhtml`;

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

      const pageXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${language}">
<head>
  <title>${escapeHtml(title)} - Page ${index + 1}</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
  ${headerHtml}
  <div class="page-content">
    ${contentHtml}
  </div>
  ${footerHtml}
</body>
</html>`;

      files[`OEBPS/${pageFilename}`] = strToU8(pageXhtml);
      manifestItems.push(
        `<item id="${pageId}" href="${pageFilename}" media-type="application/xhtml+xml"/>`,
      );
      spineItems.push(`<itemref idref="${pageId}"/>`);

      // Try to find a heading in the page for the TOC label, else use Page N
      let headingText = `Page ${index + 1}`;
      const headingBlock = page.children.find((b) => b.type === 'heading');
      if (headingBlock && headingBlock.type === 'heading') {
        headingText =
          headingBlock.runs
            .map((r) => r.text)
            .join('')
            .trim() || headingText;
      }
      navLinks.push(`<li><a href="${pageFilename}">${escapeHtml(headingText)}</a></li>`);
    });

    // 5. OEBPS/toc.xhtml
    const tocXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${language}">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${navLinks.join('\n      ')}
    </ol>
  </nav>
</body>
</html>`;
    files['OEBPS/toc.xhtml'] = strToU8(tocXhtml);

    // 6. OEBPS/content.opf
    const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">urn:uuid:seamdoc-epub-generation-${Date.now()}</dc:identifier>
    <dc:title>${escapeHtml(title)}</dc:title>
    <dc:creator>${escapeHtml(author)}</dc:creator>
    <dc:language>${escapeHtml(language)}</dc:language>
    <dc:description>${escapeHtml(description)}</dc:description>
    <meta property="dcterms:modified">${modifiedDate}</meta>
  </metadata>
  <manifest>
    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="style" href="styles.css" media-type="text/css"/>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine>
    <itemref idref="toc"/>
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
    files['OEBPS/content.opf'] = strToU8(opf);

    const zip = zipSync(files);

    const filename = settings.filename.endsWith('.epub')
      ? settings.filename
      : `${settings.filename}.epub`;

    return {
      data: zip.buffer as ArrayBuffer,
      filename,
      mimeType: 'application/epub+zip',
    };
  }
}

export const epubExporter = new EpubExporter();
