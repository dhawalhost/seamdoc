import { describe, expect, it } from 'vitest';
import { PACKAGE_NAME } from './index.js';

describe('@seamdoc/types', () => {
  it('exposes its package name', () => {
    expect(PACKAGE_NAME).toBe('@seamdoc/types');
  });
});
