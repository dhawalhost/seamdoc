import { describe, expect, it } from 'vitest';
import { builtinThemes, getBuiltinTheme } from './builtin.js';
import { validateTheme } from './schema.js';

describe('built-in themes', () => {
  it('ships the seven documented themes', () => {
    expect(builtinThemes.map((theme) => theme.metadata.id)).toEqual([
      'minimal',
      'modern',
      'github',
      'technical',
      'corporate',
      'elegant',
      'documentation',
    ]);
  });

  it.each(builtinThemes.map((theme) => [theme.metadata.id, theme] as const))(
    'theme %s passes schema validation',
    (_id, theme) => {
      const result = validateTheme(theme);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    },
  );

  it('looks up themes by id', () => {
    expect(getBuiltinTheme('github')?.metadata.name).toBe('GitHub');
    expect(getBuiltinTheme('missing')).toBeUndefined();
  });
});

describe('validateTheme', () => {
  it('rejects invalid input with descriptive errors', () => {
    const result = validateTheme({ schemaVersion: 1, metadata: { id: '' } });
    expect(result.valid).toBe(false);
    expect(result.theme).toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects malformed colors', () => {
    const broken = JSON.parse(JSON.stringify(builtinThemes[0]));
    broken.colors.primary = 'blue';
    const result = validateTheme(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('colors.primary'))).toBe(true);
  });
});
