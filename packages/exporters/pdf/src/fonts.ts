/**
 * Font resolution for the PDF exporter. PDFs embed the 14 standard fonts
 * only (see ADR 0003): theme font families are mapped onto the closest
 * standard family so exports never require network font fetches.
 */

import { StandardFonts } from 'pdf-lib';
import type { PDFDocument, PDFFont } from 'pdf-lib';
import type { RunStyle } from '@seamdoc/renderer';

type FontFamily = 'serif' | 'sans' | 'mono';

const SERIF_HINTS = [
  'times',
  'georgia',
  'garamond',
  'cambria',
  'palatino',
  'book antiqua',
  'serif',
  'merriweather',
  'lora',
  'playfair',
  'crimson',
  'baskerville',
  'caslon',
  'spectral',
  'domine',
  'bitter',
];
const MONO_HINTS = [
  'courier',
  'consolas',
  'menlo',
  'monaco',
  'mono',
  'code',
  'inconsolata',
  'jetbrains',
  'fira code',
  'cascadia',
];

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
function base64ToUint8Array(base64: string): Uint8Array {
  const base64Content = base64.includes(';base64,') ? base64.split(';base64,')[1]! : base64;
  const binaryString = atob(base64Content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/** Embeds standard and custom fonts lazily and caches them per document. */
export class FontRegistry {
  private readonly cache = new Map<StandardFonts | string, PDFFont>();

  constructor(
    private readonly document: PDFDocument,
    private readonly customFonts?: Readonly<Record<string, ArrayBuffer | ArrayBufferView | string>>,
  ) {}

  isCustomFont(style: RunStyle): boolean {
    if (!this.customFonts) return false;
    const isBold = style.fontWeight >= 600;
    const isItalic = style.italic;
    const family = style.fontFamily;
    let fontKey = family;
    if (isBold && isItalic) {
      fontKey = `${family}-BoldItalic`;
      if (!(fontKey in this.customFonts)) fontKey = `${family}-Bold-Italic`;
    } else if (isBold) {
      fontKey = `${family}-Bold`;
    } else if (isItalic) {
      fontKey = `${family}-Italic`;
    } else {
      fontKey = `${family}-Regular`;
      if (!(fontKey in this.customFonts)) fontKey = family;
    }
    return fontKey in this.customFonts || family in this.customFonts;
  }

  async fontFor(style: RunStyle): Promise<PDFFont> {
    const isBold = style.fontWeight >= 600;
    const isItalic = style.italic;

    if (this.customFonts) {
      const family = style.fontFamily;
      let fontKey = family;
      if (isBold && isItalic) {
        fontKey = `${family}-BoldItalic`;
        if (!(fontKey in this.customFonts)) fontKey = `${family}-Bold-Italic`;
      } else if (isBold) {
        fontKey = `${family}-Bold`;
      } else if (isItalic) {
        fontKey = `${family}-Italic`;
      } else {
        fontKey = `${family}-Regular`;
        if (!(fontKey in this.customFonts)) fontKey = family;
      }

      const fontData = this.customFonts[fontKey] || this.customFonts[family];
      if (fontData) {
        const cached = this.cache.get(fontKey);
        if (cached !== undefined) {
          return cached;
        }

        let bytes: Uint8Array;
        if (fontData instanceof ArrayBuffer) {
          bytes = new Uint8Array(fontData);
        } else if (typeof fontData === 'string') {
          bytes = base64ToUint8Array(fontData);
        } else if (ArrayBuffer.isView(fontData)) {
          bytes = new Uint8Array(fontData.buffer, fontData.byteOffset, fontData.byteLength);
        } else {
          throw new Error(`Unsupported font data type for ${fontKey}`);
        }

        const font = await this.document.embedFont(bytes);
        this.cache.set(fontKey, font);
        return font;
      }
    }

    const family = style.code ? 'mono' : classifyFamily(style.fontFamily);
    const name = standardFontFor(family, isBold, isItalic);
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
