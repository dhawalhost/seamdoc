import { describe, expect, it } from 'vitest';
import { highlightCodeToLines, initHighlighter, isHighlighterReady } from './index.js';

describe('highlightCodeToLines', () => {
  it('is ready after vitest setup', () => {
    expect(isHighlighterReady()).toBe(true);
  });

  it('colors TypeScript keywords differently from identifiers', async () => {
    await initHighlighter();
    const lines = highlightCodeToLines('const answer = 42;', 'typescript', '#333333');
    const colors = new Set(lines.flat().map((token) => token.color));
    expect(colors.size).toBeGreaterThan(1);
    expect(lines[0]?.map((token) => token.text).join('')).toBe('const answer = 42;');
  });

  it('falls back to plaintext for unknown languages', async () => {
    await initHighlighter();
    const lines = highlightCodeToLines('alpha beta', 'mermaid', '#111111');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toEqual([
      { text: 'alpha beta', color: '#111111', bold: false, italic: false },
    ]);
  });

  it('maps common language aliases', async () => {
    await initHighlighter();
    const ts = highlightCodeToLines('let x = 1', 'ts', '#000000');
    const js = highlightCodeToLines('let x = 1', 'javascript', '#000000');
    expect(ts[0]?.map((token) => token.color)).toEqual(js[0]?.map((token) => token.color));
  });
});
