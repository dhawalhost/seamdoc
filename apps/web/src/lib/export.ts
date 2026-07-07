/** Browser export workflow: render, serialize, and trigger a download. */

import { ExporterRegistry, exportMarkdown } from '@seamdoc/core';
import { docxExporter } from '@seamdoc/exporter-docx';
import { htmlExporter } from '@seamdoc/exporter-html';
import { odtExporter } from '@seamdoc/exporter-odt';
import { pdfExporter } from '@seamdoc/exporter-pdf';
import { pptxExporter } from '@seamdoc/exporter-pptx';
import type {
  DocumentMetadata,
  DocumentSettings,
  ExportFormat,
  ExportTemplate,
} from '@seamdoc/types';
import type { Theme } from '@seamdoc/themes';

const registry = new ExporterRegistry();
registry.register(docxExporter);
registry.register(htmlExporter);
registry.register(odtExporter);
registry.register(pdfExporter);
registry.register(pptxExporter);


function triggerDownload(data: BlobPart, mimeType: string, filename: string): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadDocument(
  format: ExportFormat,
  markdown: string,
  theme: Theme | string,
  settings: DocumentSettings,
  metadata: DocumentMetadata,
  template: ExportTemplate | null = null,
): Promise<void> {
  const result = await exportMarkdown(markdown, registry, {
    format,
    theme,
    settings,
    metadata,
    filename: metadata.title === '' ? 'document' : metadata.title,
    ...(template === null ? {} : { template }),
  });
  triggerDownload(result.data, result.mimeType, result.filename);
}

export function downloadThemeJson(theme: Theme): void {
  triggerDownload(
    JSON.stringify(theme, null, 2),
    'application/json',
    `${theme.metadata.id}-theme.json`,
  );
}
