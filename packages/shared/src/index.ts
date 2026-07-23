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

import type { BrandPack } from '@seamdoc/types';

export const BRAND_PACKS: readonly BrandPack[] = [
  {
    id: 'acme',
    name: 'Acme Corporate',
    primaryColor: '#1E3A8A',
    secondaryColor: '#3B82F6',
    fontFamilies: ['Inter', 'sans-serif'],
    headerText: 'ACME CORP — CONFIDENTIAL',
    footerText: 'Internal Use Only',
    logoUrl:
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSIyMCI+PHRleHQgeD0iMCIgeT0iMTUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzFFM0E4QSI+QUNNRTwvdGV4dD48L3N2Zz4=',
    watermarkUrl:
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMTAwIj48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjQwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0UxRTJFNyIgZmlsbC1vcGFjaXR5PSIwLjMiIHRyYW5zZm9ybT0icm90YXRlKC0xNSw1MCw1MCkiPkBDTUUgQ09SUE9SQVRFPC90ZXh0Pjwvc3ZnPg==',
  },
  {
    id: 'novatech',
    name: 'Nova Labs',
    primaryColor: '#7C3AED',
    secondaryColor: '#06B6D4',
    fontFamilies: ['Outfit', 'sans-serif'],
    headerText: 'NOVA LABS RESEARCH',
    footerText: 'Status: Draft Spec',
    logoUrl:
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSIyMCI+PHRleHQgeD0iMCIgeT0iMTUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzdDM0FFRCI+Tk9WQTwvdGV4dD48L3N2Zz4=',
    watermarkUrl:
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMTAwIj48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjQwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0UxRTJFNyIgZmlsbC1vcGFjaXR5PSIwLjMiIHRyYW5zZm9ybT0icm90YXRlKC0xNSw1MCw1MCkiPk5PVkEgTEFCUzwvdGV4dD48L3N2Zz4=',
  },
  {
    id: 'ekobios',
    name: 'Eko Bio-sciences',
    primaryColor: '#064E3B',
    secondaryColor: '#10B981',
    fontFamilies: ['Roboto', 'serif'],
    headerText: 'EKO BIOMATERIAL REPORT',
    footerText: 'Green Future Initiative',
    logoUrl:
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSIyMCI+PHRleHQgeD0iMCIgeT0iMTUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzA2NEUzQiI+RUtPPC90ZXh0Pjwvc3ZnPg==',
    watermarkUrl:
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMTAwIj48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjQwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0UxRTJFNyIgZmlsbC1vcGFjaXR5PSIwLjMiIHRyYW5zZm9ybT0icm90YXRlKC0xNSw1MCw1MCkiPkVLTyBCSU9TQ0lFTkNFUzwvdGV4dD48L3N2Zz4=',
  },
];
