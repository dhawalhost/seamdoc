/**
 * ODT exporter — produces an OpenDocument Text (.odt) file as an ArrayBuffer.
 * The output is a ZIP archive containing content.xml, styles.xml, meta.xml,
 * and META-INF/manifest.xml.
 */

import { strToU8, zipSync } from 'fflate';
import type { Exporter, ExportSettings } from '@seamdoc/types';
import type { RenderDocument } from '@seamdoc/renderer';
import { buildContentXml, buildManifestXml, buildMetaXml, buildStylesXml } from './xml.js';
import { serializeDocument } from './serialize.js';

export const odtExporter: Exporter<RenderDocument> = {
  id: 'odt',
  name: 'ODT Exporter',
  version: '0.1.0',

  supports(format) {
    return format === 'odt';
  },


  async export(document: RenderDocument, settings: ExportSettings): Promise<{
    data: ArrayBuffer;
    filename: string;
    mimeType: string;
  }> {
    const bodyXml = serializeDocument(document.pages);
    const contentXml = buildContentXml(bodyXml);
    const stylesXml = buildStylesXml();
    const metaXml = buildMetaXml(settings.metadata);
    const manifestXml = buildManifestXml();

    // Build ZIP — mimetype must be the first entry, stored (not deflated)
    const zip = zipSync({
      mimetype: [strToU8('application/vnd.oasis.opendocument.text'), { level: 0 }],
      'META-INF/manifest.xml': strToU8(manifestXml),
      'meta.xml': strToU8(metaXml),
      'styles.xml': strToU8(stylesXml),
      'content.xml': strToU8(contentXml),
    });

    const filename = settings.filename.endsWith('.odt')
      ? settings.filename
      : `${settings.filename}.odt`;

    return {
      data: zip.buffer as ArrayBuffer,
      filename,
      mimeType: 'application/vnd.oasis.opendocument.text',
    };
  },
};
