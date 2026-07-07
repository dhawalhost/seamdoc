import { describe, expect, it } from 'vitest';
import { runHeuristicCritic } from './ai.js';
import type { SdmDocument } from '@seamdoc/semantic-model';

describe('AI Layout Heuristics Critic', () => {
  it('detects skipped heading levels in hierarchy', () => {
    const doc: SdmDocument = {
      type: 'document',
      version: 1,
      metadata: {
        title: 'Test doc',
        author: '',
        description: '',
        keywords: [],
        language: 'en',
        createdAt: '',
        updatedAt: '',
      },
      children: [
        { type: 'heading', level: 1, children: [{ type: 'text', value: 'Title' }] },
        { type: 'heading', level: 3, children: [{ type: 'text', value: 'Skipped Subtitle' }] },
      ],
    };

    const findings = runHeuristicCritic(doc);
    const hierarchyWarning = findings.find((f) => f.id.startsWith('hierarchy-'));
    expect(hierarchyWarning).toBeDefined();
    expect(hierarchyWarning?.message).toContain('skipped from H1 to H3');
  });

  it('detects oversized tables with more than 6 columns', () => {
    const doc: SdmDocument = {
      type: 'document',
      version: 1,
      metadata: {
        title: 'Test doc',
        author: '',
        description: '',
        keywords: [],
        language: 'en',
        createdAt: '',
        updatedAt: '',
      },
      children: [
        {
          type: 'table',
          alignments: ['left', 'left', 'left', 'left', 'left', 'left', 'left', 'left'], // 8 columns
          header: { type: 'tableRow', cells: [] },
          rows: [],
        },
      ],
    };

    const findings = runHeuristicCritic(doc);
    const tableWarning = findings.find((f) => f.id.startsWith('table-overflow-'));
    expect(tableWarning).toBeDefined();
    expect(tableWarning?.message).toContain('Table has 8 columns');
  });

  it('warns about oversized paragraphs', () => {
    const longText = 'A'.repeat(1200);
    const doc: SdmDocument = {
      type: 'document',
      version: 1,
      metadata: {
        title: 'Test doc',
        author: '',
        description: '',
        keywords: [],
        language: 'en',
        createdAt: '',
        updatedAt: '',
      },
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: longText }],
        },
      ],
    };

    const findings = runHeuristicCritic(doc);
    const paraWarning = findings.find((f) => f.id.startsWith('paragraph-length-'));
    expect(paraWarning).toBeDefined();
    expect(paraWarning?.message).toContain('Paragraph is quite long');
  });
});
