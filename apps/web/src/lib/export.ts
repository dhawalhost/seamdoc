/** Browser export workflow: render, serialize, and trigger a download. */

import { ExporterRegistry, exportMarkdown } from '@seamdoc/core';
import { docxExporter } from '@seamdoc/exporter-docx';
import type { DocumentSettings } from '@seamdoc/types';

const registry = new ExporterRegistry();
registry.register(docxExporter);

export async function downloadDocx(
  markdown: string,
  themeId: string,
  settings: DocumentSettings,
  filename = 'document',
): Promise<void> {
  const result = await exportMarkdown(markdown, registry, {
    format: 'docx',
    theme: themeId,
    settings,
    filename,
  });

  const blob = new Blob([result.data], { type: result.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = result.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
