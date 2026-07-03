/**
 * Shiki syntax highlighting for fenced code blocks (docs/02-architecture/technology-stack.md).
 *
 * Highlighting resolves during layout so preview and exporters consume the same
 * token-colored runs in the Render Tree (docs/02-architecture/render-tree.md).
 */

import { createHighlighter, type BundledLanguage, type Highlighter } from 'shiki/bundle/web';

export const DEFAULT_SHIKI_THEME = 'github-light' as const;

/** Languages included in `shiki/bundle/web` (browser-sized bundle). */
const BUNDLED_LANGS = [
  'typescript',
  'javascript',
  'python',
  'json',
  'bash',
  'markdown',
  'yaml',
  'html',
  'css',
  'xml',
  'java',
  'sql',
] as const satisfies readonly BundledLanguage[];

const LANG_ALIASES: Record<string, BundledLanguage> = {
  ts: 'typescript',
  js: 'javascript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
  md: 'markdown',
};

export interface HighlightToken {
  readonly text: string;
  readonly color: string;
  readonly bold: boolean;
  readonly italic: boolean;
}

let highlighter: Highlighter | null = null;

/** Loads bundled grammars and the default theme. Safe to call multiple times. */
export async function initHighlighter(): Promise<void> {
  if (highlighter !== null) {
    return;
  }
  highlighter = await createHighlighter({
    themes: [DEFAULT_SHIKI_THEME],
    langs: [...BUNDLED_LANGS],
  });
}

export function isHighlighterReady(): boolean {
  return highlighter !== null;
}

function resolveLanguage(language: string): BundledLanguage | null {
  const key = language.trim().toLowerCase();
  if (key === '') {
    return null;
  }
  const alias = LANG_ALIASES[key];
  if (alias !== undefined) {
    return alias;
  }
  if (BUNDLED_LANGS.includes(key as (typeof BUNDLED_LANGS)[number])) {
    return key as BundledLanguage;
  }
  return null;
}

function plainLines(source: string, fallbackColor: string): readonly (readonly HighlightToken[])[] {
  if (source === '') {
    return [];
  }
  return source
    .split('\n')
    .map((line) => [{ text: line, color: fallbackColor, bold: false, italic: false }]);
}

function tokenStyle(fontStyle: number | undefined): { bold: boolean; italic: boolean } {
  return {
    italic: fontStyle === 1 || fontStyle === 3,
    bold: fontStyle === 2 || fontStyle === 3,
  };
}

/**
 * Tokenizes source into per-line highlighted segments. Falls back to a single
 * color per line when the highlighter is not initialized or the language fails.
 */
export function highlightCodeToLines(
  source: string,
  language: string,
  fallbackColor: string,
  shikiTheme: string = DEFAULT_SHIKI_THEME,
): readonly (readonly HighlightToken[])[] {
  if (highlighter === null) {
    return plainLines(source, fallbackColor);
  }

  const lang = resolveLanguage(language);
  if (lang === null) {
    return plainLines(source, fallbackColor);
  }

  try {
    const result = highlighter.codeToTokens(source, { lang, theme: shikiTheme });
    return result.tokens.map((line) =>
      line.map((token) => {
        const style = tokenStyle(token.fontStyle);
        return {
          text: token.content,
          color: token.color ?? fallbackColor,
          bold: style.bold,
          italic: style.italic,
        };
      }),
    );
  } catch {
    return plainLines(source, fallbackColor);
  }
}
