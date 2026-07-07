/**
 * Render tree validation (docs/02-architecture/render-tree.md).
 * Checks duplicate IDs, invalid bounds, and empty pages before export.
 */

import type { RenderBlock, RenderDocument } from './render-tree.js';

export interface RenderTreeIssue {
  readonly path: string;
  readonly message: string;
}

export interface RenderTreeValidationResult {
  readonly valid: boolean;
  readonly issues: readonly RenderTreeIssue[];
}

export function validateRenderTree(document: RenderDocument): RenderTreeValidationResult {
  const issues: RenderTreeIssue[] = [];
  const seenIds = new Set<string>();

  if (document.pages.length === 0) {
    issues.push({ path: '/pages', message: 'Render tree contains no pages.' });
  }

  document.pages.forEach((page, pageIndex) => {
    const pagePath = `/pages/${pageIndex}`;
    if (seenIds.has(page.id)) {
      issues.push({ path: pagePath, message: `Duplicate node id "${page.id}".` });
    }
    seenIds.add(page.id);

    if (page.width <= 0 || page.height <= 0) {
      issues.push({ path: pagePath, message: 'Page has non-positive dimensions.' });
    }
    // An empty document legitimately renders as one empty page; only extra
    // empty pages indicate a pagination bug.
    if (page.children.length === 0 && document.pages.length > 1) {
      issues.push({ path: pagePath, message: 'Page has no content.' });
    }

    page.children.forEach((block, blockIndex) => {
      checkBlock(block, `${pagePath}/children/${blockIndex}`, seenIds, issues);
    });
  });

  return { valid: issues.length === 0, issues };
}

function checkBlock(
  block: RenderBlock,
  path: string,
  seenIds: Set<string>,
  issues: RenderTreeIssue[],
): void {
  if (seenIds.has(block.id)) {
    issues.push({ path, message: `Duplicate node id "${block.id}".` });
  }
  seenIds.add(block.id);

  if (block.bounds.width < 0 || block.bounds.height < 0) {
    issues.push({ path, message: 'Block has negative bounds.' });
  }

  if (block.type === 'quote') {
    block.children.forEach((child, index) =>
      checkBlock(child, `${path}/children/${index}`, seenIds, issues),
    );
  }
  if (block.type === 'list') {
    block.items.forEach((item, itemIndex) =>
      item.children.forEach((child, index) =>
        checkBlock(child, `${path}/items/${itemIndex}/children/${index}`, seenIds, issues),
      ),
    );
  }
  if (block.type === 'columns') {
    block.columns.forEach((col, colIndex) => {
      if (seenIds.has(col.id)) {
        issues.push({
          path: `${path}/columns/${colIndex}`,
          message: `Duplicate node id "${col.id}".`,
        });
      }
      seenIds.add(col.id);
      col.children.forEach((child, index) =>
        checkBlock(child, `${path}/columns/${colIndex}/children/${index}`, seenIds, issues),
      );
    });
  }
}
