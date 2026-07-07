/**
 * Resolves theme styles for semantic inline content into flat text runs.
 * After this stage no theme inheritance remains (docs/02-architecture/render-tree.md).
 */

import type { SdmInline } from '@seamdoc/semantic-model';
import type { Theme } from '@seamdoc/themes';
import type { RunStyle, TextRun } from './render-tree.js';

export function baseRunStyle(theme: Theme): RunStyle {
  return {
    fontFamily: theme.paragraph.fontFamily,
    fontSize: theme.paragraph.fontSize,
    fontWeight: theme.paragraph.fontWeight,
    italic: theme.paragraph.italic,
    color: theme.paragraph.color,
    underline: false,
    code: false,
    link: '',
  };
}

export function headingRunStyle(theme: Theme, level: 1 | 2 | 3 | 4 | 5 | 6): RunStyle {
  const heading = theme.headings[`h${level}`];
  return {
    fontFamily: heading.fontFamily,
    fontSize: heading.fontSize,
    fontWeight: heading.fontWeight,
    italic: heading.italic,
    color: heading.color,
    underline: false,
    code: false,
    link: '',
  };
}

/**
 * Flattens nested inline nodes (strong inside emphasis, links, inline code)
 * into a sequence of runs with fully resolved styles.
 */
export function resolveInlines(
  nodes: readonly SdmInline[],
  theme: Theme,
  base: RunStyle,
): readonly TextRun[] {
  const runs: TextRun[] = [];
  collectRuns(nodes, theme, base, runs);
  return runs;
}

function collectRuns(
  nodes: readonly SdmInline[],
  theme: Theme,
  style: RunStyle,
  out: TextRun[],
): void {
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        out.push({ text: node.value, style });
        break;
      case 'emphasis':
        collectRuns(node.children, theme, { ...style, italic: true }, out);
        break;
      case 'strong':
        collectRuns(node.children, theme, { ...style, fontWeight: 700 }, out);
        break;
      case 'inlineCode':
        out.push({
          text: node.value,
          style: {
            ...style,
            fontFamily: theme.code.fontFamily,
            fontSize: theme.code.fontSize,
            code: true,
          },
        });
        break;
      case 'link':
        collectRuns(
          node.children,
          theme,
          {
            ...style,
            color: theme.link.color,
            underline: theme.link.underline,
            link: node.url,
          },
          out,
        );
        break;
      case 'lineBreak':
        out.push({ text: '\n', style });
        break;
      case 'image':
        // Inline images degrade to their alt text in run context; block-level
        // images are handled by the layout engine.
        out.push({ text: node.alt, style: { ...style, italic: true } });
        break;
      case 'input':
        if (node.inputType === 'checkbox') {
          out.push({
            text: node.checked ? '[x]' : '[ ]',
            style,
            input: {
              inputType: 'checkbox',
              name: node.name,
              ...(node.checked !== undefined ? { checked: node.checked } : {}),
            },
          });
        } else {
          out.push({
            text: `[${'_'.repeat(node.width ?? 10)}]`,
            style,
            input: {
              inputType: 'text',
              name: node.name,
              ...(node.width !== undefined ? { width: node.width } : {}),
            },
          });
        }
        break;

      default: {
        const exhaustive: never = node;
        throw new Error(`Unhandled inline node: ${JSON.stringify(exhaustive)}`);
      }
    }
  }
}
