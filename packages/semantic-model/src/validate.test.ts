import { describe, expect, it } from 'vitest';
import { DEFAULT_DOCUMENT_METADATA, SDM_VERSION } from '@seamdoc/shared';
import type { SdmDocument } from './nodes.js';
import { validateDocument } from './validate.js';

function doc(children: SdmDocument['children']): SdmDocument {
  return { type: 'document', version: SDM_VERSION, metadata: DEFAULT_DOCUMENT_METADATA, children };
}

describe('validateDocument', () => {
  it('accepts a well-formed document', () => {
    const result = validateDocument(
      doc([
        { type: 'heading', level: 1, children: [{ type: 'text', value: 'Title' }] },
        {
          type: 'quote',
          children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Quoted' }] }],
        },
      ]),
    );
    expect(result.valid).toBe(true);
  });

  it('rejects unknown top-level block types', () => {
    const result = validateDocument(doc([{ type: 'bogus' }] as never));
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.path).toBe('/children/0');
  });

  it('rejects unknown inline types inside paragraphs', () => {
    const result = validateDocument(
      doc([{ type: 'paragraph', children: [{ type: 'bogus' }] as never }]),
    );
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.path).toBe('/children/0/children/0');
  });

  it('rejects unknown blocks nested inside quotes', () => {
    const result = validateDocument(
      doc([{ type: 'quote', children: [{ type: 'bogus' }] as never }]),
    );
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.path).toBe('/children/0/children/0');
  });

  it('rejects unknown blocks nested inside list items', () => {
    const result = validateDocument(
      doc([
        {
          type: 'list',
          ordered: false,
          items: [{ type: 'listItem', children: [{ type: 'bogus' }] as never }],
        },
      ]),
    );
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.path).toBe('/children/0/items/0/children/0');
  });
});
