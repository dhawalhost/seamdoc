/**
 * Theme-aware live preview. Renders the same Render Tree that exporters
 * consume, so the preview matches exported documents as closely as possible.
 */

import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { renderMarkdown } from '@seamdoc/core';
import type { RenderBlock, RenderDocument, RenderListItem, TextRun } from '@seamdoc/renderer';
import type { DocumentSettings } from '@seamdoc/types';

interface PreviewPaneProps {
  markdown: string;
  themeId: string;
  settings: DocumentSettings;
}

function runStyle(run: TextRun): CSSProperties {
  return {
    fontFamily: run.style.fontFamily,
    fontSize: `${run.style.fontSize}pt`,
    fontWeight: run.style.fontWeight,
    fontStyle: run.style.italic ? 'italic' : 'normal',
    color: run.style.color,
    textDecoration: run.style.underline ? 'underline' : 'none',
  };
}

function Runs({ runs }: { runs: readonly TextRun[] }) {
  return (
    <>
      {runs.map((run, index) =>
        run.style.link !== '' ? (
          <a key={index} href={run.style.link} style={runStyle(run)}>
            {run.text}
          </a>
        ) : (
          <span key={index} style={runStyle(run)}>
            {run.text}
          </span>
        ),
      )}
    </>
  );
}

function ListItems({ items, ordered }: { items: readonly RenderListItem[]; ordered: boolean }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag style={{ margin: 0, paddingLeft: '1.5em' }}>
      {items.map((item) => (
        <li key={item.id}>
          {item.children.map((child) => (
            <Block key={child.id} block={child} />
          ))}
        </li>
      ))}
    </Tag>
  );
}

function Block({ block }: { block: RenderBlock }): ReactNode {
  const spacing =
    block.type === 'table'
      ? {}
      : { marginTop: `${block.spacing.before}pt`, marginBottom: `${block.spacing.after}pt` };

  switch (block.type) {
    case 'heading':
      return (
        <div style={{ ...spacing, textAlign: block.alignment }} data-preview="heading">
          <Runs runs={block.runs} />
        </div>
      );
    case 'paragraph':
      return (
        <div
          style={{ ...spacing, textAlign: block.alignment, lineHeight: block.lineHeight }}
          data-preview="paragraph"
        >
          <Runs runs={block.runs} />
        </div>
      );
    case 'codeBlock':
      return (
        <pre
          data-preview="code"
          style={{
            ...spacing,
            background: block.background,
            padding: `${block.padding}pt`,
            fontFamily: block.style.fontFamily,
            fontSize: `${block.style.fontSize}pt`,
            color: block.style.color,
            overflowX: 'auto',
          }}
        >
          {block.lines.join('\n')}
        </pre>
      );
    case 'quote':
      return (
        <div
          data-preview="quote"
          style={{
            ...spacing,
            borderLeft: `${block.borderWidth}pt solid ${block.borderColor}`,
            paddingLeft: `${block.indent}pt`,
          }}
        >
          {block.children.map((child) => (
            <Block key={child.id} block={child} />
          ))}
        </div>
      );
    case 'list':
      return (
        <div style={spacing} data-preview="list">
          <ListItems items={block.items} ordered={block.ordered} />
        </div>
      );
    case 'table':
      return (
        <table
          data-preview="table"
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            border: `${block.borderWidth}pt solid ${block.borderColor}`,
          }}
        >
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell) => (
                  <td
                    key={cell.id}
                    style={{
                      border: `${block.borderWidth}pt solid ${block.borderColor}`,
                      padding: `${block.cellPadding}pt`,
                      textAlign: cell.alignment,
                      background: cell.background === '' ? undefined : cell.background,
                    }}
                  >
                    <Runs runs={cell.runs} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'image':
      return (
        <div style={{ ...spacing, textAlign: block.alignment }} data-preview="image">
          <img
            src={block.src}
            alt={block.alt}
            style={{ maxWidth: '100%', display: 'inline-block' }}
          />
        </div>
      );
    case 'rule':
      return (
        <hr
          data-preview="rule"
          style={{
            ...spacing,
            border: 'none',
            borderTop: `${block.thickness}pt solid ${block.color}`,
          }}
        />
      );
    default: {
      const exhaustive: never = block;
      throw new Error(`Unhandled preview block: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export const PreviewPane = forwardRef<HTMLDivElement, PreviewPaneProps>(function PreviewPane(
  { markdown, themeId, settings }: PreviewPaneProps,
  scrollRef,
) {
  const [debounced, setDebounced] = useState(markdown);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(markdown), 150);
    return () => window.clearTimeout(timer);
  }, [markdown]);

  const rendered = useMemo<RenderDocument | null>(() => {
    try {
      return renderMarkdown(debounced, { theme: themeId, settings }).renderDocument;
    } catch {
      return null;
    }
  }, [debounced, themeId, settings]);

  if (rendered === null) {
    return (
      <div className="p-6 text-sm text-red-600" data-testid="preview-error">
        Unable to render preview.
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto bg-neutral-200 p-6 dark:bg-neutral-800"
      data-testid="preview"
    >
      <div className="mx-auto flex flex-col items-center gap-6">
        {rendered.pages.map((page, index) => (
          <div
            key={page.id}
            data-testid="preview-page"
            className="bg-white shadow-lg"
            style={{
              width: `${page.width}pt`,
              minHeight: `${page.height}pt`,
              maxWidth: '100%',
              paddingTop: `${page.margins.top}pt`,
              paddingRight: `${page.margins.right}pt`,
              paddingBottom: `${page.margins.bottom}pt`,
              paddingLeft: `${page.margins.left}pt`,
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            {page.header !== null && (
              <div
                style={{
                  position: 'absolute',
                  top: '24pt',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontFamily: page.header.style.fontFamily,
                  fontSize: `${page.header.style.fontSize}pt`,
                  color: page.header.style.color,
                }}
              >
                {page.header.text}
              </div>
            )}
            {page.children.map((block) => (
              <Block key={block.id} block={block} />
            ))}
            {page.footer !== null && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '24pt',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontFamily: page.footer.style.fontFamily,
                  fontSize: `${page.footer.style.fontSize}pt`,
                  color: page.footer.style.color,
                }}
              >
                {page.footer.text}
                {page.footer.pageNumbers ? ` ${index + 1}` : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
