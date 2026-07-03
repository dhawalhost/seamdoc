import { describe, expect, it } from 'vitest';
import { computeDocumentStats, formatDocumentStats } from './documentStats.js';

describe('documentStats', () => {
  it('counts words, lines, and characters', () => {
    expect(computeDocumentStats('one two\nthree')).toEqual({
      words: 3,
      lines: 2,
      characters: 13,
    });
  });

  it('returns zeros for empty input', () => {
    expect(computeDocumentStats('   ')).toEqual({ words: 0, lines: 0, characters: 0 });
  });

  it('formats a readable summary', () => {
    expect(formatDocumentStats({ words: 1, lines: 2, characters: 3 })).toBe(
      '1 word · 2 lines · 3 chars',
    );
  });
});
