import { describe, expect, it } from 'vitest';
import { createIdGenerator } from './id.js';

describe('createIdGenerator', () => {
  it('generates sequential ids per prefix', () => {
    const ids = createIdGenerator();
    expect(ids.next('page')).toBe('page-1');
    expect(ids.next('page')).toBe('page-2');
    expect(ids.next('paragraph')).toBe('paragraph-1');
  });

  it('is deterministic across instances', () => {
    const a = createIdGenerator();
    const b = createIdGenerator();
    expect(a.next('node')).toBe(b.next('node'));
  });
});
