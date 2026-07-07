/**
 * Render Tree definitions (docs/02-architecture/render-tree.md).
 *
 * The Render Tree is the canonical rendering representation: fully resolved
 * styles, final layout, no theme or Markdown knowledge. It is the only
 * structure exporters consume.
 */

import type { DocumentMetadata, PageMargins, PageBorder } from '@seamdoc/types';

export interface Bounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Spacing {
  readonly before: number;
  readonly after: number;
}

export type RenderAlignment = 'left' | 'center' | 'right' | 'justify';

/** Fully resolved text styling; no inheritance remains. */
export interface RunStyle {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly italic: boolean;
  readonly color: string;
  readonly underline: boolean;
  readonly code: boolean;
  /** Hyperlink target; empty string when the run is not a link. */
  readonly link: string;
}

export interface TextRun {
  readonly text: string;
  readonly style: RunStyle;
}

interface BaseRenderNode {
  readonly id: string;
  readonly bounds: Bounds;
}

export interface RenderHeading extends BaseRenderNode {
  readonly type: 'heading';
  readonly level: 1 | 2 | 3 | 4 | 5 | 6;
  readonly runs: readonly TextRun[];
  readonly alignment: RenderAlignment;
  readonly spacing: Spacing;
}

export interface RenderParagraph extends BaseRenderNode {
  readonly type: 'paragraph';
  readonly runs: readonly TextRun[];
  readonly alignment: RenderAlignment;
  readonly spacing: Spacing;
  readonly lineHeight: number;
}

export interface RenderCodeBlock extends BaseRenderNode {
  readonly type: 'codeBlock';
  readonly language: string;
  /** One highlighted line per source line; syntax colors are resolved. */
  readonly lines: readonly (readonly TextRun[])[];
  readonly style: RunStyle;
  readonly background: string;
  readonly padding: number;
  readonly spacing: Spacing;
}

export interface RenderQuote extends BaseRenderNode {
  readonly type: 'quote';
  readonly children: readonly RenderBlock[];
  readonly borderColor: string;
  readonly borderWidth: number;
  readonly indent: number;
  readonly spacing: Spacing;
}

export interface RenderListItem {
  readonly id: string;
  /** Marker text, e.g. "1." or "•". */
  readonly marker: string;
  readonly depth: number;
  readonly children: readonly RenderBlock[];
}

export interface RenderList extends BaseRenderNode {
  readonly type: 'list';
  readonly ordered: boolean;
  readonly indent: number;
  readonly items: readonly RenderListItem[];
  readonly spacing: Spacing;
}

export interface RenderTableCell {
  readonly id: string;
  readonly runs: readonly TextRun[];
  readonly alignment: RenderAlignment;
  readonly background: string;
}

export interface RenderTableRow {
  readonly id: string;
  readonly header: boolean;
  readonly cells: readonly RenderTableCell[];
}

export interface RenderTable extends BaseRenderNode {
  readonly type: 'table';
  readonly rows: readonly RenderTableRow[];
  readonly columnWidths: readonly number[];
  readonly borderColor: string;
  readonly borderWidth: number;
  readonly cellPadding: number;
}

export interface RenderImage extends BaseRenderNode {
  readonly type: 'image';
  readonly src: string;
  readonly alt: string;
  readonly alignment: RenderAlignment;
  readonly spacing: Spacing;
}

export interface RenderRule extends BaseRenderNode {
  readonly type: 'rule';
  readonly color: string;
  readonly thickness: number;
  readonly spacing: Spacing;
}

export interface RenderColumn {
  readonly id: string;
  readonly children: readonly RenderBlock[];
  readonly width: number;
}

export interface RenderColumns extends BaseRenderNode {
  readonly type: 'columns';
  readonly columns: readonly RenderColumn[];
  readonly spacing: Spacing;
}

export type RenderBlock =
  | RenderHeading
  | RenderParagraph
  | RenderCodeBlock
  | RenderQuote
  | RenderList
  | RenderTable
  | RenderImage
  | RenderRule
  | RenderColumns;

export interface RenderHeaderFooter {
  readonly text: string;
  readonly style: RunStyle;
  readonly pageNumbers: boolean;
}

export interface RenderPage {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly margins: PageMargins;
  readonly border: PageBorder | null;
  readonly header: RenderHeaderFooter | null;
  readonly footer: RenderHeaderFooter | null;
  readonly children: readonly RenderBlock[];
}

export interface RenderDocument {
  readonly version: number;
  readonly metadata: DocumentMetadata;
  readonly pages: readonly RenderPage[];
}
