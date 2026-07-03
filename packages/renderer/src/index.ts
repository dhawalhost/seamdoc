/** Renderer: render tree types, style resolution, and the layout engine. */

export type {
  Bounds,
  RenderAlignment,
  RenderBlock,
  RenderCodeBlock,
  RenderDocument,
  RenderHeaderFooter,
  RenderHeading,
  RenderImage,
  RenderList,
  RenderListItem,
  RenderPage,
  RenderParagraph,
  RenderQuote,
  RenderRule,
  RenderTable,
  RenderTableCell,
  RenderTableRow,
  RunStyle,
  Spacing,
  TextRun,
} from './render-tree.js';
export { layoutDocument, type LayoutInput } from './layout.js';
export {
  validateRenderTree,
  type RenderTreeIssue,
  type RenderTreeValidationResult,
} from './validate.js';
export { baseRunStyle, headingRunStyle, resolveInlines } from './style-resolver.js';
export { estimateLineCount, estimateParagraphHeight, estimateRunWidth } from './measure.js';
