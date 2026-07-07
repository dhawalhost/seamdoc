/** Semantic Document Model: node types, mdast conversion, and validation. */

export type {
  SdmBlock,
  SdmCellAlignment,
  SdmCodeBlock,
  SdmDocument,
  SdmEmphasis,
  SdmHeading,
  SdmImage,
  SdmInline,
  SdmInlineCode,
  SdmLineBreak,
  SdmLink,
  SdmList,
  SdmListItem,
  SdmNode,
  SdmParagraph,
  SdmQuote,
  SdmStrong,
  SdmTable,
  SdmTableCell,
  SdmTableRow,
  SdmText,
  SdmThematicBreak,
  SdmColumn,
  SdmColumns,
  SdmInput,
} from './nodes.js';

export { cloneDocument } from './clone.js';
export { fromMdast, type FromMdastOptions } from './from-mdast.js';
export { validateDocument, type ValidationIssue, type ValidationResult } from './validate.js';
