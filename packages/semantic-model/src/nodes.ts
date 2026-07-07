/**
 * Semantic Document Model (SDM) node definitions.
 * See docs/02-architecture/semantic-document-model.md.
 *
 * Nodes carry only semantic information: no colors, fonts, sizes, margins,
 * theme, or layout data. All nodes are deeply readonly (immutable after
 * creation) and JSON-serializable.
 */

import type { DocumentMetadata } from '@seamdoc/types';

export interface SdmText {
  readonly type: 'text';
  readonly value: string;
}

export interface SdmEmphasis {
  readonly type: 'emphasis';
  readonly children: readonly SdmInline[];
}

export interface SdmStrong {
  readonly type: 'strong';
  readonly children: readonly SdmInline[];
}

export interface SdmInlineCode {
  readonly type: 'inlineCode';
  readonly value: string;
}

export interface SdmLink {
  readonly type: 'link';
  readonly url: string;
  readonly title: string | null;
  readonly children: readonly SdmInline[];
}

export interface SdmLineBreak {
  readonly type: 'lineBreak';
}

export interface SdmImage {
  readonly type: 'image';
  readonly src: string;
  readonly alt: string;
  readonly title: string | null;
}

export type SdmInline =
  SdmText | SdmEmphasis | SdmStrong | SdmInlineCode | SdmLink | SdmLineBreak | SdmImage;

export interface SdmHeading {
  readonly type: 'heading';
  readonly level: 1 | 2 | 3 | 4 | 5 | 6;
  readonly children: readonly SdmInline[];
}

export interface SdmParagraph {
  readonly type: 'paragraph';
  readonly children: readonly SdmInline[];
}

export interface SdmCodeBlock {
  readonly type: 'code';
  readonly language: string | null;
  readonly value: string;
}

export interface SdmQuote {
  readonly type: 'quote';
  readonly children: readonly SdmBlock[];
}

export interface SdmThematicBreak {
  readonly type: 'thematicBreak';
}

export interface SdmListItem {
  readonly type: 'listItem';
  readonly children: readonly SdmBlock[];
}

export interface SdmList {
  readonly type: 'list';
  readonly ordered: boolean;
  readonly items: readonly SdmListItem[];
}

export type SdmCellAlignment = 'left' | 'center' | 'right' | 'none';

export interface SdmTableCell {
  readonly type: 'tableCell';
  readonly children: readonly SdmInline[];
}

export interface SdmTableRow {
  readonly type: 'tableRow';
  readonly cells: readonly SdmTableCell[];
}

export interface SdmTable {
  readonly type: 'table';
  readonly alignments: readonly SdmCellAlignment[];
  readonly header: SdmTableRow | null;
  readonly rows: readonly SdmTableRow[];
}

export interface SdmColumn {
  readonly type: 'column';
  readonly children: readonly SdmBlock[];
}

export interface SdmColumns {
  readonly type: 'columns';
  readonly children: readonly SdmColumn[];
}

export type SdmBlock =
  | SdmHeading
  | SdmParagraph
  | SdmCodeBlock
  | SdmQuote
  | SdmThematicBreak
  | SdmList
  | SdmTable
  | SdmColumns;

export interface SdmDocument {
  readonly type: 'document';
  readonly version: number;
  readonly metadata: DocumentMetadata;
  readonly children: readonly SdmBlock[];
}

export type SdmNode = SdmDocument | SdmBlock | SdmInline | SdmListItem | SdmTableRow | SdmTableCell;
