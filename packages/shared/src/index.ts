/** Shared constants, enums, and default values. */

import type {
  DocumentMetadata,
  DocumentSettings,
  PageDimensions,
  PageSizeName,
} from '@seamdoc/types';

/** Page dimensions in points, portrait orientation. */
export const PAGE_SIZES: Readonly<Record<PageSizeName, PageDimensions>> = {
  A3: { width: 841.89, height: 1190.55 },
  A4: { width: 595.28, height: 841.89 },
  A5: { width: 419.53, height: 595.28 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
};

export const DEFAULT_DOCUMENT_SETTINGS: DocumentSettings = {
  pageSize: 'A4',
  orientation: 'portrait',
  margins: { top: 72, right: 72, bottom: 72, left: 72 },
  header: '',
  footer: '',
  pageNumbers: false,
  fontFamily: null,
  fontSize: null,
  lineSpacing: null,
  paragraphSpacing: null,
};

export const DEFAULT_DOCUMENT_METADATA: DocumentMetadata = {
  title: '',
  author: '',
  description: '',
  keywords: [],
  language: 'en',
  createdAt: '1970-01-01T00:00:00.000Z',
  updatedAt: '1970-01-01T00:00:00.000Z',
};

export const SDM_VERSION = 1;
export const RENDER_TREE_VERSION = 1;
