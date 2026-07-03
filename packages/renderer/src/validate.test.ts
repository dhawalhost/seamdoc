import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '@seamdoc/parser';
import { fromMdast } from '@seamdoc/semantic-model';
import { DEFAULT_DOCUMENT_SETTINGS } from '@seamdoc/shared';
import { minimalTheme } from '@seamdoc/themes';
import { layoutDocument } from './layout.js';
import { validateRenderTree } from './validate.js';

describe('validateRenderTree', () => {
  it('accepts trees produced by the layout engine', () => {
    const document = fromMdast(parseMarkdown('# Hi\n\ntext'));
    const tree = layoutDocument({
      document,
      theme: minimalTheme,
      settings: DEFAULT_DOCUMENT_SETTINGS,
    });
    const result = validateRenderTree(tree);
    expect(result.issues).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('flags duplicate ids and empty page lists', () => {
    const document = fromMdast(parseMarkdown('one\n\ntwo'));
    const tree = layoutDocument({
      document,
      theme: minimalTheme,
      settings: DEFAULT_DOCUMENT_SETTINGS,
    });
    const page = tree.pages[0]!;
    const [a, b] = page.children;
    const broken = {
      ...tree,
      pages: [{ ...page, children: [a!, { ...b!, id: a!.id }] }],
    };
    const result = validateRenderTree(broken);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes('Duplicate'))).toBe(true);

    const empty = { ...tree, pages: [] };
    expect(validateRenderTree(empty).valid).toBe(false);
  });
});
