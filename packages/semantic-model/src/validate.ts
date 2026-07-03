/**
 * SDM validation (docs/02-architecture/semantic-document-model.md).
 * Rendering stops only for fatal validation errors.
 */

import { SDM_VERSION } from '@seamdoc/shared';
import type { SdmBlock, SdmDocument } from './nodes.js';

const BLOCK_TYPES: ReadonlySet<SdmBlock['type']> = new Set([
  'heading',
  'paragraph',
  'code',
  'quote',
  'thematicBreak',
  'list',
  'table',
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
  }

  document.children.forEach((block, index) => {
    if (!BLOCK_TYPES.has(block.type)) {
      issues.push({
        path: `/children/${index}`,
        message: `Unknown block type "${String(block.type)}".`,
      });
      return;
    }
    if (block.type === 'heading' && (block.level < 1 || block.level > 6)) {
      issues.push({
        path: `/children/${index}`,
        message: `Invalid heading level ${block.level}.`,
      });
    }
  });

  return { valid: issues.length === 0, issues };
}
