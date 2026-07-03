/** Document statistics shown in the editor toolbar. */
export interface DocumentStats {
  readonly words: number;
  readonly lines: number;
  readonly characters: number;
}

export function computeDocumentStats(markdown: string): DocumentStats {
  if (markdown.trim() === '') {
    return { words: 0, lines: 0, characters: 0 };
  }
  return {
    words: markdown.trim().split(/\s+/).length,
    lines: markdown.split('\n').length,
    characters: markdown.length,
  };
}

export function formatDocumentStats(stats: DocumentStats): string {
  const wordLabel = stats.words === 1 ? 'word' : 'words';
  return `${stats.words} ${wordLabel} · ${stats.lines} lines · ${stats.characters} chars`;
}
