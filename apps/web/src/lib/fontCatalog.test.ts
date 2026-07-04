import { describe, expect, it } from 'vitest';
import {
  FONT_CATALOG,
  findFontOption,
  googleFontsStylesheetUrl,
  webFontsToLoad,
} from './fontCatalog.js';

describe('fontCatalog', () => {
  it('includes common document and web fonts', () => {
    expect(findFontOption('Calibri')).toBeDefined();
    expect(findFontOption('Inter')?.web).toBe(true);
    expect(findFontOption('Times New Roman')?.web).toBe(false);
    expect(FONT_CATALOG.length).toBeGreaterThan(50);
  });

  it('collects only web fonts for preview loading', () => {
    expect(webFontsToLoad(['Calibri', 'Inter', 'Roboto', 'Inter'])).toEqual([
      'Inter',
      'Roboto',
    ]);
  });

  it('builds a Google Fonts stylesheet URL', () => {
    const url = googleFontsStylesheetUrl(['Inter', 'Lora']);
    expect(url).toContain('fonts.googleapis.com/css2');
    expect(url).toContain('Inter');
    expect(url).toContain('Lora');
    expect(googleFontsStylesheetUrl([])).toBeNull();
  });
});
