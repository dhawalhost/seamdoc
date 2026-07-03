/**
 * Font resolution for the PDF exporter. PDFs embed the 14 standard fonts
 * only (see ADR 0003): theme font families are mapped onto the closest
 * standard family so exports never require network font fetches.
 */

import { StandardFonts } from 'pdf-lib';
import type { PDFDocument, PDFFont } from 'pdf-lib';
import type { RunStyle } from '@seamdoc/renderer';

type FontFamily = 'serif' | 'sans' | 'mono';

const SERIF_HINTS = ['times', 'georgia', 'garamond', 'cambria', 'palatino', 'book antiqua', 'serif'];
const MONO_HINTS = ['courier', 'consolas', 'menlo', 'monaco', 'mono', 'code'];

function classifyFamily(fontFamily: string): FontFamily {
  const normalized = fontFamily.toLowerCase();
  if (MONO_HINTS.some((hint) => normalized.includes(hint))) {
    return 'mono';
  }
  if (SERIF_HINTS.some((hint) => normalized.includes(hint))) {
    return 'serif';
  }
  return 'sans';
}

function standardFontFor(family: FontFamily, bold: boolean, italic: boolean): StandardFonts {
  switch (family) {
    case 'serif':
      if (bold && italic) return StandardFonts.TimesRomanBoldItalic;
      if (bold) return StandardFonts.TimesRomanBold;
      if (italic) return StandardFonts.TimesRomanItalic;
      return StandardFonts.TimesRoman;
    case 'mono':
      if (bold && italic) return StandardFonts.CourierBoldOblique;
      if (bold) return StandardFonts.CourierBold;
      if (italic) return StandardFonts.CourierOblique;
      return StandardFonts.Courier;
    case 'sans':
      if (bold && italic) return StandardFonts.HelveticaBoldOblique;
      if (bold) return StandardFonts.HelveticaBold;
      if (italic) return StandardFonts.HelveticaOblique;
      return StandardFonts.Helvetica;
    default: {
      const exhaustive: never = family;
      throw new Error(`Unhandled font family: ${String(exhaustive)}`);
    }
  }
}

/** Embeds standard fonts lazily and caches them per document. */
export class FontRegistry {
  private readonly cache = new Map<StandardFonts, PDFFont>();

  constructor(private readonly document: PDFDocument) {}

  async fontFor(style: RunStyle): Promise<PDFFont> {
    const family = style.code ? 'mono' : classifyFamily(style.fontFamily);
    const name = standardFontFor(family, style.fontWeight >= 600, style.italic);
    const cached = this.cache.get(name);
    if (cached !== undefined) {
      return cached;
    }
    const font = await this.document.embedFont(name);
    this.cache.set(name, font);
    return font;
  }
}

/**
 * Standard fonts use WinAnsi encoding; characters outside it would throw at
 * draw time. Replace anything unencodable with a placeholder.
 */
export function sanitizeText(text: string): string {
  // Latin-1 plus the common typographic characters WinAnsi supports.
  return text.replace(
    /[^\x20-\x7E\u00A0-\u00FF\u0152\u0153\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]/g,
    '?',
  );
}
