import { describe, expect, it } from 'vitest';
import { builtinThemes, getBuiltinTheme } from './builtin.js';
import {
  DEFAULT_THEME_BRANDING,
  createThemeDraft,
  validateTheme,
} from './schema.js';

describe('built-in themes', () => {
  it('ships core, Google Docs–style, and Microsoft Office–style themes', () => {
    expect(builtinThemes.map((theme) => theme.metadata.id)).toEqual([
      'minimal',
      'modern',
      'github',
      'technical',
      'corporate',
      'elegant',
      'documentation',
      'spectrum',
      'coral',
      'spearmint',
      'tropic',
      'plum',
      'geometric',
      'writer',
      'academic',
      'newsletter',
      'slate',
      'sunset',
      'forest',
      'paper',
      'midnight',
      'meeting',
      'proposal',
      'office',
      'facet',
      'ion',
      'organic',
      'retrospect',
      'slice',
      'wisp',
      'banded',
      'dividend',
      'whitepaper',
      'resume',
      'agenda',
      'brochure',
      'formal-letter',
    ]);
    expect(builtinThemes).toHaveLength(37);
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

  it('fills branding defaults when older theme JSON omits branding', () => {
    const legacy = JSON.parse(JSON.stringify(builtinThemes[0])) as Record<string, unknown>;
    delete legacy['branding'];
    const result = validateTheme(legacy);
    expect(result.valid).toBe(true);
    expect(result.theme?.branding).toEqual(DEFAULT_THEME_BRANDING);
  });

  it('creates an editable draft with a custom id', () => {
    const draft = createThemeDraft(builtinThemes[0]!);
    expect(draft.metadata.id).toContain('-custom');
    expect(draft.metadata.name).toContain('(custom)');
    expect(draft.branding).toBeDefined();
  });
});
