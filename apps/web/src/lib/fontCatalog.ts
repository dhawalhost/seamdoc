/**
 * Curated font catalog for theme creator and document settings.
 * Includes common Office/system fonts and popular Google Fonts.
 * Users can still type any custom family name.
 */

export type FontCategory = 'sans' | 'serif' | 'mono' | 'display';

export interface FontOption {
  readonly family: string;
  readonly category: FontCategory;
  /** When true, preview may load the face from Google Fonts. */
  readonly web: boolean;
}

/** Popular, widely available families for document authoring. */
export const FONT_CATALOG: readonly FontOption[] = [
  // Sans — system / Office
  { family: 'Arial', category: 'sans', web: false },
  { family: 'Calibri', category: 'sans', web: false },
  { family: 'Candara', category: 'sans', web: false },
  { family: 'Century Gothic', category: 'sans', web: false },
  { family: 'Comic Sans MS', category: 'sans', web: false },
  { family: 'Corbel', category: 'sans', web: false },
  { family: 'Franklin Gothic Medium', category: 'sans', web: false },
  { family: 'Gill Sans', category: 'sans', web: false },
  { family: 'Helvetica', category: 'sans', web: false },
  { family: 'Impact', category: 'sans', web: false },
  { family: 'Lucida Sans Unicode', category: 'sans', web: false },
  { family: 'Segoe UI', category: 'sans', web: false },
  { family: 'Tahoma', category: 'sans', web: false },
  { family: 'Trebuchet MS', category: 'sans', web: false },
  { family: 'Verdana', category: 'sans', web: false },
  // Sans — web
  { family: 'Inter', category: 'sans', web: true },
  { family: 'Roboto', category: 'sans', web: true },
  { family: 'Open Sans', category: 'sans', web: true },
  { family: 'Lato', category: 'sans', web: true },
  { family: 'Montserrat', category: 'sans', web: true },
  { family: 'Poppins', category: 'sans', web: true },
  { family: 'Nunito', category: 'sans', web: true },
  { family: 'Nunito Sans', category: 'sans', web: true },
  { family: 'Source Sans 3', category: 'sans', web: true },
  { family: 'Work Sans', category: 'sans', web: true },
  { family: 'Raleway', category: 'sans', web: true },
  { family: 'Ubuntu', category: 'sans', web: true },
  { family: 'Noto Sans', category: 'sans', web: true },
  { family: 'PT Sans', category: 'sans', web: true },
  { family: 'Oswald', category: 'sans', web: true },
  { family: 'Rubik', category: 'sans', web: true },
  { family: 'Mulish', category: 'sans', web: true },
  { family: 'Manrope', category: 'sans', web: true },
  { family: 'DM Sans', category: 'sans', web: true },
  { family: 'IBM Plex Sans', category: 'sans', web: true },
  { family: 'Fira Sans', category: 'sans', web: true },
  { family: 'Karla', category: 'sans', web: true },
  { family: 'Barlow', category: 'sans', web: true },
  { family: 'Outfit', category: 'sans', web: true },
  { family: 'Figtree', category: 'sans', web: true },
  { family: 'Plus Jakarta Sans', category: 'sans', web: true },
  // Serif — system / Office
  { family: 'Times New Roman', category: 'serif', web: false },
  { family: 'Georgia', category: 'serif', web: false },
  { family: 'Garamond', category: 'serif', web: false },
  { family: 'Palatino Linotype', category: 'serif', web: false },
  { family: 'Book Antiqua', category: 'serif', web: false },
  { family: 'Cambria', category: 'serif', web: false },
  { family: 'Constantia', category: 'serif', web: false },
  { family: 'Baskerville', category: 'serif', web: false },
  // Serif — web
  { family: 'Merriweather', category: 'serif', web: true },
  { family: 'Lora', category: 'serif', web: true },
  { family: 'Playfair Display', category: 'serif', web: true },
  { family: 'Source Serif 4', category: 'serif', web: true },
  { family: 'Noto Serif', category: 'serif', web: true },
  { family: 'PT Serif', category: 'serif', web: true },
  { family: 'Libre Baskerville', category: 'serif', web: true },
  { family: 'EB Garamond', category: 'serif', web: true },
  { family: 'Cormorant Garamond', category: 'serif', web: true },
  { family: 'Crimson Text', category: 'serif', web: true },
  { family: 'Crimson Pro', category: 'serif', web: true },
  { family: 'Libre Caslon Text', category: 'serif', web: true },
  { family: 'IBM Plex Serif', category: 'serif', web: true },
  { family: 'Bitter', category: 'serif', web: true },
  { family: 'Domine', category: 'serif', web: true },
  { family: 'Spectral', category: 'serif', web: true },
  // Mono — system
  { family: 'Consolas', category: 'mono', web: false },
  { family: 'Courier New', category: 'mono', web: false },
  { family: 'Lucida Console', category: 'mono', web: false },
  { family: 'Menlo', category: 'mono', web: false },
  { family: 'Monaco', category: 'mono', web: false },
  { family: 'Cascadia Code', category: 'mono', web: false },
  // Mono — web
  { family: 'Source Code Pro', category: 'mono', web: true },
  { family: 'Fira Code', category: 'mono', web: true },
  { family: 'JetBrains Mono', category: 'mono', web: true },
  { family: 'IBM Plex Mono', category: 'mono', web: true },
  { family: 'Roboto Mono', category: 'mono', web: true },
  { family: 'Inconsolata', category: 'mono', web: true },
  { family: 'Space Mono', category: 'mono', web: true },
  { family: 'Ubuntu Mono', category: 'mono', web: true },
  { family: 'Noto Sans Mono', category: 'mono', web: true },
  // Display — web
  { family: 'Abril Fatface', category: 'display', web: true },
  { family: 'Bebas Neue', category: 'display', web: true },
  { family: 'Lobster', category: 'display', web: true },
  { family: 'Pacifico', category: 'display', web: true },
  { family: 'Righteous', category: 'display', web: true },
  { family: 'Comfortaa', category: 'display', web: true },
  { family: 'Josefin Sans', category: 'display', web: true },
  { family: 'Quicksand', category: 'display', web: true },
];

const CATEGORY_LABEL: Record<FontCategory, string> = {
  sans: 'Sans-serif',
  serif: 'Serif',
  mono: 'Monospace',
  display: 'Display',
};

export function fontCategoryLabel(category: FontCategory): string {
  return CATEGORY_LABEL[category];
}

export function findFontOption(family: string): FontOption | undefined {
  const needle = family.trim().toLowerCase();
  return FONT_CATALOG.find((font) => font.family.toLowerCase() === needle);
}

/** Fonts that should be loaded from Google Fonts for live preview. */
export function webFontsToLoad(families: readonly string[]): readonly string[] {
  const unique = new Set<string>();
  for (const family of families) {
    const option = findFontOption(family);
    if (option?.web === true) {
      unique.add(option.family);
    }
  }
  return [...unique].sort((a, b) => a.localeCompare(b));
}

/** Builds a Google Fonts CSS2 URL for the given families (preview only). */
export function googleFontsStylesheetUrl(families: readonly string[]): string | null {
  if (families.length === 0) {
    return null;
  }
  const query = families
    .map((family) => `family=${encodeURIComponent(family).replace(/%20/g, '+')}:ital,wght@0,400;0,700;1,400;1,700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
