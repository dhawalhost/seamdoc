import { describe, expect, it } from 'vitest';
import { parseMarkdown } from './index.js';

describe('parseMarkdown', () => {
  it('parses headings, paragraphs, and code blocks', () => {
    const ast = parseMarkdown('# Title\n\nHello **world**.\n\n```ts\nconst x = 1;\n```\n');
    expect(ast.type).toBe('root');
    expect(ast.children.map((node) => node.type)).toEqual(['heading', 'paragraph', 'code']);
  });

  it('parses GFM tables', () => {
    const ast = parseMarkdown('| a | b |\n| - | - |\n| 1 | 2 |\n');
    expect(ast.children[0]?.type).toBe('table');
  });

  it('is deterministic', () => {
    const markdown = '# Same\n\ninput\n';
    expect(parseMarkdown(markdown)).toEqual(parseMarkdown(markdown));
  });
});
