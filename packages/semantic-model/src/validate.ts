/**
 * SDM validation (docs/02-architecture/semantic-document-model.md).
 * Rendering stops only for fatal validation errors. Walks the full tree so
 * malformed plugin output is caught before layout.
 */

import { SDM_VERSION } from '@seamdoc/shared';
import type {
  SdmBlock,
  SdmDocument,
  SdmInline,
  SdmListItem,
  SdmTableRow,
  SdmColumns,
} from './nodes.js';

const BLOCK_TYPES: ReadonlySet<SdmBlock['type']> = new Set([
  'heading',
  'paragraph',
  'code',
  'quote',
  'thematicBreak',
  'list',
  'table',
  'columns',
]);

const INLINE_TYPES: ReadonlySet<SdmInline['type']> = new Set([
  'text',
  'emphasis',
  'strong',
  'inlineCode',
  'lineBreak',
  'link',
  'image',
  'input',
]);

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}

export function validateDocument(document: SdmDocument): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (document.type !== 'document') {
    issues.push({ path: '/', message: 'Root node must have type "document".' });
  }
  if (document.version !== SDM_VERSION) {
    issues.push({
      path: '/version',
      message: `Unsupported SDM version ${document.version}; expected ${SDM_VERSION}.`,
    });
  }
  if (!Array.isArray(document.children)) {
    issues.push({ path: '/children', message: 'Document children must be an array.' });
    return { valid: false, issues };
  }

  document.children.forEach((block, index) => {
    validateBlock(block, `/children/${index}`, issues);
  });

  return { valid: issues.length === 0, issues };
}

function validateBlock(block: SdmBlock, path: string, issues: ValidationIssue[]): void {
  if (!BLOCK_TYPES.has(block.type)) {
    issues.push({ path, message: `Unknown block type "${String(block.type)}".` });
    return;
  }

  switch (block.type) {
    case 'heading':
      if (block.level < 1 || block.level > 6) {
        issues.push({ path, message: `Invalid heading level ${block.level}.` });
      }
      validateInlines(block.children, `${path}/children`, issues);
      break;
    case 'paragraph':
      validateInlines(block.children, `${path}/children`, issues);
      break;
    case 'code':
      if (typeof block.value !== 'string') {
        issues.push({ path: `${path}/value`, message: 'Code block value must be a string.' });
      }
      break;
    case 'quote':
      block.children.forEach((child, index) => {
        validateBlock(child, `${path}/children/${index}`, issues);
      });
      break;
    case 'thematicBreak':
      break;
    case 'list':
      block.items.forEach((item, index) => {
        validateListItem(item, `${path}/items/${index}`, issues);
      });
      break;
    case 'table':
      if (block.header !== null) {
        validateTableRow(block.header, `${path}/header`, issues);
      }
      block.rows.forEach((row, index) => {
        validateTableRow(row, `${path}/rows/${index}`, issues);
      });
      break;
    case 'columns': {
      const columnsBlock = block as SdmColumns;
      columnsBlock.children.forEach((col, colIndex) => {
        const colPath = `${path}/children/${colIndex}`;
        if (col.type !== 'column') {
          issues.push({ path: colPath, message: 'Column children must have type "column".' });
          return;
        }
        col.children.forEach((child, childIndex) => {
          validateBlock(child, `${colPath}/children/${childIndex}`, issues);
        });
      });
      break;
    }
    default: {
      const exhaustive: never = block;
      throw new Error(`Unhandled block type: ${String(exhaustive)}`);
    }
  }
}

function validateListItem(item: SdmListItem, path: string, issues: ValidationIssue[]): void {
  if (item.type !== 'listItem') {
    issues.push({ path, message: 'List entry must have type "listItem".' });
    return;
  }
  item.children.forEach((child, index) => {
    validateBlock(child, `${path}/children/${index}`, issues);
  });
}

function validateTableRow(row: SdmTableRow, path: string, issues: ValidationIssue[]): void {
  if (row.type !== 'tableRow') {
    issues.push({ path, message: 'Table row must have type "tableRow".' });
    return;
  }
  row.cells.forEach((cell, index) => {
    if (cell.type !== 'tableCell') {
      issues.push({
        path: `${path}/cells/${index}`,
        message: 'Table cell must have type "tableCell".',
      });
      return;
    }
    validateInlines(cell.children, `${path}/cells/${index}/children`, issues);
  });
}

function validateInlines(
  inlines: readonly SdmInline[],
  path: string,
  issues: ValidationIssue[],
): void {
  inlines.forEach((inline, index) => {
    const inlinePath = `${path}/${index}`;
    if (!INLINE_TYPES.has(inline.type)) {
      issues.push({ path: inlinePath, message: `Unknown inline type "${String(inline.type)}".` });
      return;
    }

    switch (inline.type) {
      case 'text':
        if (typeof inline.value !== 'string') {
          issues.push({ path: `${inlinePath}/value`, message: 'Text value must be a string.' });
        }
        break;
      case 'emphasis':
      case 'strong':
        validateInlines(inline.children, `${inlinePath}/children`, issues);
        break;
      case 'inlineCode':
        if (typeof inline.value !== 'string') {
          issues.push({
            path: `${inlinePath}/value`,
            message: 'Inline code value must be a string.',
          });
        }
        break;
      case 'link':
        validateInlines(inline.children, `${inlinePath}/children`, issues);
        break;
      case 'lineBreak':
        break;
      case 'image':
        if (typeof inline.src !== 'string' || typeof inline.alt !== 'string') {
          issues.push({ path: inlinePath, message: 'Image must have string src and alt.' });
        }
        break;
      case 'input':
        if (inline.inputType !== 'checkbox' && inline.inputType !== 'text') {
          issues.push({
            path: `${inlinePath}/inputType`,
            message: 'Input type must be "checkbox" or "text".',
          });
        }
        if (typeof inline.name !== 'string' || inline.name === '') {
          issues.push({
            path: `${inlinePath}/name`,
            message: 'Input name must be a non-empty string.',
          });
        }
        break;
      default: {
        const exhaustive: never = inline;
        throw new Error(`Unhandled inline type: ${String(exhaustive)}`);
      }
    }
  });
}
