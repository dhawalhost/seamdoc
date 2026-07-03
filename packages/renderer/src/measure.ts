/**
 * Deterministic text measurement heuristics.
 *
 * The layout engine needs block heights to paginate. Exact glyph metrics are
 * unavailable outside a rendering surface, so measurement uses a stable
 * average-character-width model. The estimates only drive pagination and
 * bounds; exporters like DOCX re-flow text natively, so approximation is
 * safe while determinism is preserved.
 */

import type { TextRun } from './render-tree.js';

/** Average glyph width as a fraction of font size for proportional fonts. */
const AVERAGE_CHAR_WIDTH_RATIO = 0.5;
/** Monospace glyphs are wider on average. */
const MONO_CHAR_WIDTH_RATIO = 0.6;

export function estimateRunWidth(run: TextRun): number {
  const ratio = run.style.code ? MONO_CHAR_WIDTH_RATIO : AVERAGE_CHAR_WIDTH_RATIO;
  return run.text.length * run.style.fontSize * ratio;
}

export function estimateLineCount(runs: readonly TextRun[], availableWidth: number): number {
  if (availableWidth <= 0) {
    return 1;
  }
  const totalWidth = runs.reduce((sum, run) => sum + estimateRunWidth(run), 0);
  return Math.max(1, Math.ceil(totalWidth / availableWidth));
}

export function estimateParagraphHeight(
  runs: readonly TextRun[],
  availableWidth: number,
  fontSize: number,
  lineHeight: number,
): number {
  const lines = estimateLineCount(runs, availableWidth);
  return lines * fontSize * lineHeight;
}
