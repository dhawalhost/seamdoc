/**
 * Built-in themes (docs/02-architecture/theme-engine.md): Minimal, Modern,
 * GitHub, Technical, Corporate, Elegant, Documentation.
 *
 * Each theme is a complete, valid theme document. Variants are derived from
 * the minimal base so shared values stay consistent.
 */

import type { Theme, ThemeHeadingStyle } from './schema.js';

interface HeadingScale {
  readonly sizes: readonly [number, number, number, number, number, number];
  readonly fontFamily: string;
  readonly color: string;
  readonly weight: number;
}

function buildHeadings(scale: HeadingScale): Theme['headings'] {
  const build = (size: number): ThemeHeadingStyle => ({
    fontFamily: scale.fontFamily,
    fontSize: size,
    fontWeight: scale.weight,
    italic: false,
    color: scale.color,
    alignment: 'left',
    spacing: { before: Math.round(size * 0.9), after: Math.round(size * 0.45) },
  });
  const [h1, h2, h3, h4, h5, h6] = scale.sizes;
  return {
    h1: build(h1),
    h2: build(h2),
    h3: build(h3),
    h4: build(h4),
    h5: build(h5),
    h6: build(h6),
  };
}

interface ThemeSeed {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly bodyFont: string;
  readonly headingFont: string;
  /** Defaults to Courier New when omitted. */
  readonly codeFont?: string;
  readonly primary: string;
  readonly text: string;
  readonly accent: string;
  readonly border: string;
  readonly codeBackground: string;
  readonly headingColor: string;
  readonly headingWeight: number;
  readonly headingSizes: readonly [number, number, number, number, number, number];
  readonly bodySize: number;
  readonly lineHeight: number;
}

function buildTheme(seed: ThemeSeed): Theme {
  const codeFont = seed.codeFont ?? 'Courier New';
  return {
    schemaVersion: 1,
    metadata: {
      id: seed.id,
      name: seed.name,
      version: '1.0.0',
      author: 'Seamdoc',
      description: seed.description,
      license: 'MIT',
    },
    typography: { body: seed.bodyFont, heading: seed.headingFont, code: codeFont },
    colors: {
      primary: seed.primary,
      text: seed.text,
      background: '#ffffff',
      border: seed.border,
      accent: seed.accent,
      codeBackground: seed.codeBackground,
    },
    headings: buildHeadings({
      sizes: seed.headingSizes,
      fontFamily: seed.headingFont,
      color: seed.headingColor,
      weight: seed.headingWeight,
    }),
    paragraph: {
      fontFamily: seed.bodyFont,
      fontSize: seed.bodySize,
      fontWeight: 400,
      italic: false,
      color: seed.text,
      alignment: 'left',
      lineHeight: seed.lineHeight,
      spacing: { before: 0, after: Math.round(seed.bodySize * 0.75) },
    },
    list: { indent: 24, spacing: { before: 2, after: 2 } },
    table: {
      headerBackground: seed.codeBackground,
      headerColor: seed.headingColor,
      headerFontWeight: 700,
      borderColor: seed.border,
      borderWidth: 0.75,
      cellPadding: 5,
    },
    image: { alignment: 'center', maxWidth: 451, spacing: { before: 8, after: 8 } },
    code: {
      fontFamily: codeFont,
      fontSize: Math.round(seed.bodySize * 0.9),
      color: seed.text,
      background: seed.codeBackground,
      padding: 8,
      spacing: { before: 8, after: 8 },
    },
    quote: {
      borderColor: seed.accent,
      borderWidth: 3,
      color: seed.text,
      italic: true,
      indent: 18,
      spacing: { before: 8, after: 8 },
    },
    link: { color: seed.primary, underline: true },
    horizontalRule: { color: seed.border, thickness: 1, spacing: { before: 12, after: 12 } },
    branding: {
      logo: '',
      headerBackground: seed.codeBackground,
      headerTextColor: seed.headingColor,
      showLogo: false,
    },
  };
}

/**
 * Font pairings (body / heading / code). Code defaults to Courier New.
 * Extra themes follow Google Docs–style template aesthetics (color stories
 * and use cases: reports, essays, newsletters, proposals, notes, etc.).
 *
 * | Theme          | Body            | Heading           | Rationale                                      |
 * |----------------|-----------------|-------------------|------------------------------------------------|
 * | minimal        | Inter           | Inter             | Neutral, highly legible default                |
 * | modern         | Manrope         | Montserrat        | Geometric body + confident display headings    |
 * | github         | Source Sans 3   | Source Sans 3     | Product-docs UI sans (GitHub-adjacent)          |
 * | technical      | IBM Plex Sans   | IBM Plex Sans     | Engineered for dense technical reading         |
 * | corporate      | Source Serif 4  | Source Sans 3     | Report serif body + professional sans headings |
 * | elegant        | EB Garamond     | Playfair Display  | Literary body + high-contrast display titles  |
 * | documentation  | Open Sans       | Inter             | Long-form docs body + clear section headings   |
 * | spectrum       | Inter           | Poppins           | Bright Google-docs “simple color” template     |
 * | coral          | Lato            | Poppins           | Warm coral proposal / flyer feel               |
 * | spearmint      | Nunito Sans     | Nunito            | Fresh mint notes and handouts                  |
 * | tropic         | Karla           | Montserrat        | Teal travel / lifestyle template               |
 * | plum           | Lora            | Playfair Display  | Deep plum luxe invitation / program            |
 * | geometric      | DM Sans         | Outfit            | Bold geometric marketing one-pager             |
 * | writer         | Lora            | Libre Baskerville | Modern writer / manuscript                     |
 * | academic       | Merriweather    | Source Serif 4    | Classic essay and research paper               |
 * | newsletter     | Source Sans 3   | Oswald            | Magazine / newsletter columns                  |
 * | slate          | IBM Plex Sans   | IBM Plex Sans     | Cool gray status report                        |
 * | sunset         | Nunito          | Oswald            | Warm orange campaign brief                     |
 * | forest         | Source Serif 4  | Montserrat        | Nature / sustainability report                 |
 * | paper          | Georgia         | Georgia           | Warm letterhead / memo on paper                |
 * | midnight       | Source Sans 3   | Montserrat        | Navy executive brief                           |
 * | meeting        | Inter           | Inter             | Compact meeting notes                          |
 * | proposal       | Source Serif 4  | Montserrat        | Client proposal deck-in-doc                    |
 * | office         | Calibri         | Calibri           | Classic Microsoft Word default                 |
 * | facet          | Calibri         | Calibri           | Office Facet teal template                     |
 * | ion            | Segoe UI        | Segoe UI          | Ion Boardroom executive style                  |
 * | organic        | Calibri         | Cambria           | Office Organic soft green                      |
 * | retrospect     | Cambria         | Cambria           | Office Retrospect warm formal                  |
 * | slice          | Calibri         | Segoe UI          | Office Slice bold accent                       |
 * | wisp           | Calibri         | Calibri           | Office Wisp light airy                         |
 * | banded         | Calibri         | Calibri           | Banded business report                         |
 * | dividend       | Cambria         | Calibri           | Financial / dividend report                    |
 * | whitepaper     | Cambria         | Calibri           | Microsoft-style white paper                    |
 * | resume         | Calibri         | Calibri           | Clean resume / CV                              |
 * | agenda         | Segoe UI        | Segoe UI          | Meeting agenda                                 |
 * | brochure       | Calibri         | Segoe UI          | Marketing brochure                             |
 * | formal-letter  | Times New Roman | Times New Roman   | Formal business letter                         |
 */

export const minimalTheme = buildTheme({
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean, unobtrusive defaults for any document.',
  bodyFont: 'Inter',
  headingFont: 'Inter',
  primary: '#2563eb',
  text: '#1f2933',
  accent: '#94a3b8',
  border: '#d9dde3',
  codeBackground: '#f4f5f7',
  headingColor: '#111827',
  headingWeight: 700,
  headingSizes: [26, 20, 16, 14, 12, 11],
  bodySize: 11,
  lineHeight: 1.35,
});

export const modernTheme = buildTheme({
  id: 'modern',
  name: 'Modern',
  description: 'Contemporary look with strong contrast and generous spacing.',
  bodyFont: 'Manrope',
  headingFont: 'Montserrat',
  primary: '#7c3aed',
  text: '#111827',
  accent: '#7c3aed',
  border: '#e5e7eb',
  codeBackground: '#f5f3ff',
  headingColor: '#4c1d95',
  headingWeight: 600,
  headingSizes: [28, 21, 17, 14, 12, 11],
  bodySize: 11,
  lineHeight: 1.5,
});

export const githubTheme = buildTheme({
  id: 'github',
  name: 'GitHub',
  description: 'GitHub-inspired documentation styling.',
  bodyFont: 'Source Sans 3',
  headingFont: 'Source Sans 3',
  primary: '#0969da',
  text: '#1f2328',
  accent: '#d0d7de',
  border: '#d0d7de',
  codeBackground: '#f6f8fa',
  headingColor: '#1f2328',
  headingWeight: 600,
  headingSizes: [24, 19, 16, 13, 12, 11],
  bodySize: 11,
  lineHeight: 1.5,
});

export const technicalTheme = buildTheme({
  id: 'technical',
  name: 'Technical',
  description: 'Dense, precise styling for engineering documents.',
  bodyFont: 'IBM Plex Sans',
  headingFont: 'IBM Plex Sans',
  primary: '#0f766e',
  text: '#111827',
  accent: '#0f766e',
  border: '#9ca3af',
  codeBackground: '#f3f4f6',
  headingColor: '#0f172a',
  headingWeight: 700,
  headingSizes: [22, 17, 14, 12, 11, 10],
  bodySize: 10,
  lineHeight: 1.25,
});

export const corporateTheme = buildTheme({
  id: 'corporate',
  name: 'Corporate',
  description: 'Professional business report styling.',
  bodyFont: 'Source Serif 4',
  headingFont: 'Source Sans 3',
  primary: '#1d4ed8',
  text: '#1f2933',
  accent: '#1d4ed8',
  border: '#cbd5e1',
  codeBackground: '#f1f5f9',
  headingColor: '#1e3a8a',
  headingWeight: 700,
  headingSizes: [24, 18, 15, 13, 12, 11],
  bodySize: 11,
  lineHeight: 1.4,
});

export const elegantTheme = buildTheme({
  id: 'elegant',
  name: 'Elegant',
  description: 'Refined serif styling for polished long-form documents.',
  bodyFont: 'EB Garamond',
  headingFont: 'Playfair Display',
  primary: '#9d174d',
  text: '#292524',
  accent: '#9d174d',
  border: '#d6d3d1',
  codeBackground: '#faf7f5',
  headingColor: '#44403c',
  headingWeight: 600,
  headingSizes: [28, 22, 17, 14, 13, 12],
  bodySize: 12,
  lineHeight: 1.5,
});

export const documentationTheme = buildTheme({
  id: 'documentation',
  name: 'Documentation',
  description: 'Readable defaults tuned for software documentation.',
  bodyFont: 'Open Sans',
  headingFont: 'Inter',
  primary: '#0284c7',
  text: '#1e293b',
  accent: '#0284c7',
  border: '#cbd5e1',
  codeBackground: '#f0f9ff',
  headingColor: '#0c4a6e',
  headingWeight: 700,
  headingSizes: [24, 19, 15, 13, 12, 11],
  bodySize: 10,
  lineHeight: 1.45,
});

// --- Google Docs–style template themes ---

export const spectrumTheme = buildTheme({
  id: 'spectrum',
  name: 'Spectrum',
  description: 'Bright, friendly template for general-purpose documents.',
  bodyFont: 'Inter',
  headingFont: 'Poppins',
  primary: '#1a73e8',
  text: '#202124',
  accent: '#ea4335',
  border: '#dadce0',
  codeBackground: '#f8f9fa',
  headingColor: '#174ea6',
  headingWeight: 600,
  headingSizes: [26, 20, 16, 14, 12, 11],
  bodySize: 11,
  lineHeight: 1.5,
});

export const coralTheme = buildTheme({
  id: 'coral',
  name: 'Coral',
  description: 'Warm coral accents for proposals, flyers, and announcements.',
  bodyFont: 'Lato',
  headingFont: 'Poppins',
  primary: '#e85d4c',
  text: '#3f2a28',
  accent: '#f4a261',
  border: '#f0d6d0',
  codeBackground: '#fff5f3',
  headingColor: '#c2410c',
  headingWeight: 700,
  headingSizes: [28, 21, 17, 14, 12, 11],
  bodySize: 11,
  lineHeight: 1.45,
});

export const spearmintTheme = buildTheme({
  id: 'spearmint',
  name: 'Spearmint',
  description: 'Fresh mint styling for notes, handouts, and classroom docs.',
  bodyFont: 'Nunito Sans',
  headingFont: 'Nunito',
  primary: '#0d9488',
  text: '#134e4a',
  accent: '#5eead4',
  border: '#ccfbf1',
  codeBackground: '#f0fdfa',
  headingColor: '#115e59',
  headingWeight: 700,
  headingSizes: [26, 20, 16, 13, 12, 11],
  bodySize: 11,
  lineHeight: 1.5,
});

export const tropicTheme = buildTheme({
  id: 'tropic',
  name: 'Tropic',
  description: 'Teal lifestyle template for travel, events, and creative briefs.',
  bodyFont: 'Karla',
  headingFont: 'Montserrat',
  primary: '#0e7490',
  text: '#164e63',
  accent: '#22d3ee',
  border: '#a5f3fc',
  codeBackground: '#ecfeff',
  headingColor: '#155e75',
  headingWeight: 700,
  headingSizes: [28, 22, 17, 14, 12, 11],
  bodySize: 11,
  lineHeight: 1.5,
});

export const plumTheme = buildTheme({
  id: 'plum',
  name: 'Plum',
  description: 'Deep plum luxe styling for programs, invitations, and portfolios.',
  bodyFont: 'Lora',
  headingFont: 'Playfair Display',
  primary: '#7e22ce',
  text: '#3b0764',
  accent: '#c084fc',
  border: '#e9d5ff',
  codeBackground: '#faf5ff',
  headingColor: '#581c87',
  headingWeight: 600,
  headingSizes: [30, 22, 17, 14, 13, 12],
  bodySize: 12,
  lineHeight: 1.55,
});

export const geometricTheme = buildTheme({
  id: 'geometric',
  name: 'Geometric',
  description: 'Bold geometric marketing one-pagers and product sheets.',
  bodyFont: 'DM Sans',
  headingFont: 'Outfit',
  primary: '#4f46e5',
  text: '#1e1b4b',
  accent: '#818cf8',
  border: '#c7d2fe',
  codeBackground: '#eef2ff',
  headingColor: '#312e81',
  headingWeight: 700,
  headingSizes: [30, 22, 18, 14, 12, 11],
  bodySize: 11,
  lineHeight: 1.45,
});

export const writerTheme = buildTheme({
  id: 'writer',
  name: 'Writer',
  description: 'Modern writer template for manuscripts and long-form essays.',
  bodyFont: 'Lora',
  headingFont: 'Libre Baskerville',
  primary: '#57534e',
  text: '#292524',
  accent: '#a8a29e',
  border: '#e7e5e4',
  codeBackground: '#fafaf9',
  headingColor: '#1c1917',
  headingWeight: 700,
  headingSizes: [26, 20, 16, 14, 12, 11],
  bodySize: 12,
  lineHeight: 1.65,
});

export const academicTheme = buildTheme({
  id: 'academic',
  name: 'Academic',
  description: 'Classic essay and research-paper styling.',
  bodyFont: 'Merriweather',
  headingFont: 'Source Serif 4',
  primary: '#1e3a5f',
  text: '#1c1917',
  accent: '#78716c',
  border: '#d6d3d1',
  codeBackground: '#f5f5f4',
  headingColor: '#0c1929',
  headingWeight: 700,
  headingSizes: [22, 16, 14, 12, 11, 10],
  bodySize: 11,
  lineHeight: 1.7,
});

export const newsletterTheme = buildTheme({
  id: 'newsletter',
  name: 'Newsletter',
  description: 'Magazine-style newsletter and bulletin layout.',
  bodyFont: 'Source Sans 3',
  headingFont: 'Oswald',
  primary: '#b91c1c',
  text: '#1f2937',
  accent: '#f87171',
  border: '#fecaca',
  codeBackground: '#fef2f2',
  headingColor: '#7f1d1d',
  headingWeight: 600,
  headingSizes: [28, 20, 16, 13, 12, 11],
  bodySize: 10,
  lineHeight: 1.4,
});

export const slateTheme = buildTheme({
  id: 'slate',
  name: 'Slate',
  description: 'Cool gray status reports and internal memos.',
  bodyFont: 'IBM Plex Sans',
  headingFont: 'IBM Plex Sans',
  primary: '#475569',
  text: '#0f172a',
  accent: '#94a3b8',
  border: '#cbd5e1',
  codeBackground: '#f1f5f9',
  headingColor: '#1e293b',
  headingWeight: 700,
  headingSizes: [24, 18, 15, 13, 12, 11],
  bodySize: 11,
  lineHeight: 1.4,
});

export const sunsetTheme = buildTheme({
  id: 'sunset',
  name: 'Sunset',
  description: 'Warm orange campaign briefs and launch plans.',
  bodyFont: 'Nunito',
  headingFont: 'Oswald',
  primary: '#ea580c',
  text: '#431407',
  accent: '#fb923c',
  border: '#fed7aa',
  codeBackground: '#fff7ed',
  headingColor: '#9a3412',
  headingWeight: 600,
  headingSizes: [28, 21, 17, 14, 12, 11],
  bodySize: 11,
  lineHeight: 1.45,
});

export const forestTheme = buildTheme({
  id: 'forest',
  name: 'Forest',
  description: 'Nature and sustainability reports with grounded greens.',
  bodyFont: 'Source Serif 4',
  headingFont: 'Montserrat',
  primary: '#166534',
  text: '#14532d',
  accent: '#4ade80',
  border: '#bbf7d0',
  codeBackground: '#f0fdf4',
  headingColor: '#14532d',
  headingWeight: 700,
  headingSizes: [26, 20, 16, 13, 12, 11],
  bodySize: 11,
  lineHeight: 1.5,
});

export const paperTheme = buildTheme({
  id: 'paper',
  name: 'Paper',
  description: 'Warm letterhead and memo styling on classic paper tones.',
  bodyFont: 'Georgia',
  headingFont: 'Georgia',
  primary: '#92400e',
  text: '#44403c',
  accent: '#d6d3d1',
  border: '#e7e5e4',
  codeBackground: '#fafaf9',
  headingColor: '#292524',
  headingWeight: 700,
  headingSizes: [24, 18, 15, 13, 12, 11],
  bodySize: 12,
  lineHeight: 1.55,
});

export const midnightTheme = buildTheme({
  id: 'midnight',
  name: 'Midnight',
  description: 'Navy executive briefs and board updates.',
  bodyFont: 'Source Sans 3',
  headingFont: 'Montserrat',
  primary: '#1e3a8a',
  text: '#0f172a',
  accent: '#3b82f6',
  border: '#bfdbfe',
  codeBackground: '#eff6ff',
  headingColor: '#1e3a8a',
  headingWeight: 700,
  headingSizes: [26, 20, 16, 13, 12, 11],
  bodySize: 11,
  lineHeight: 1.45,
});

export const meetingTheme = buildTheme({
  id: 'meeting',
  name: 'Meeting',
  description: 'Compact meeting notes and action-item lists.',
  bodyFont: 'Inter',
  headingFont: 'Inter',
  primary: '#0369a1',
  text: '#0c4a6e',
  accent: '#7dd3fc',
  border: '#bae6fd',
  codeBackground: '#f0f9ff',
  headingColor: '#075985',
  headingWeight: 600,
  headingSizes: [20, 16, 13, 12, 11, 10],
  bodySize: 10,
  lineHeight: 1.35,
});

export const proposalTheme = buildTheme({
  id: 'proposal',
  name: 'Proposal',
  description: 'Client proposals and pitch documents.',
  bodyFont: 'Source Serif 4',
  headingFont: 'Montserrat',
  primary: '#0f766e',
  text: '#134e4a',
  accent: '#14b8a6',
  border: '#99f6e4',
  codeBackground: '#f0fdfa',
  headingColor: '#115e59',
  headingWeight: 700,
  headingSizes: [28, 20, 16, 13, 12, 11],
  bodySize: 11,
  lineHeight: 1.5,
});

// --- Microsoft Office / Word–style themes ---

export const officeTheme = buildTheme({
  id: 'office',
  name: 'Office',
  description: 'Classic Microsoft Word default (Calibri and Office blue).',
  bodyFont: 'Calibri',
  headingFont: 'Calibri',
  primary: '#2b579a',
  text: '#000000',
  accent: '#5b9bd5',
  border: '#d0d0d0',
  codeBackground: '#f2f2f2',
  headingColor: '#2b579a',
  headingWeight: 700,
  headingSizes: [26, 20, 16, 14, 12, 11],
  bodySize: 11,
  lineHeight: 1.15,
});

export const facetTheme = buildTheme({
  id: 'facet',
  name: 'Facet',
  description: 'Microsoft Office Facet template with teal accents.',
  bodyFont: 'Calibri',
  headingFont: 'Calibri',
  primary: '#31859c',
  text: '#1f4e5f',
  accent: '#4bacc6',
  border: '#b6dde8',
  codeBackground: '#eef7fa',
  headingColor: '#215968',
  headingWeight: 700,
  headingSizes: [26, 20, 16, 14, 12, 11],
  bodySize: 11,
  lineHeight: 1.2,
});

export const ionTheme = buildTheme({
  id: 'ion',
  name: 'Ion',
  description: 'Ion Boardroom executive style from Microsoft Office themes.',
  bodyFont: 'Segoe UI',
  headingFont: 'Segoe UI',
  primary: '#5f497a',
  text: '#262626',
  accent: '#8064a2',
  border: '#ccc1d9',
  codeBackground: '#f5f2f8',
  headingColor: '#403152',
  headingWeight: 600,
  headingSizes: [28, 20, 16, 14, 12, 11],
  bodySize: 11,
  lineHeight: 1.35,
});

export const organicTheme = buildTheme({
  id: 'organic',
  name: 'Organic',
  description: 'Microsoft Office Organic theme with soft greens.',
  bodyFont: 'Calibri',
  headingFont: 'Cambria',
  primary: '#548235',
  text: '#375623',
  accent: '#a9d08e',
  border: '#c5e0b4',
  codeBackground: '#f2f9ef',
  headingColor: '#375623',
  headingWeight: 700,
  headingSizes: [26, 20, 16, 14, 12, 11],
  bodySize: 11,
  lineHeight: 1.25,
});

export const retrospectTheme = buildTheme({
  id: 'retrospect',
  name: 'Retrospect',
  description: 'Microsoft Office Retrospect warm formal theme.',
  bodyFont: 'Cambria',
  headingFont: 'Cambria',
  primary: '#833c0c',
  text: '#3f2008',
  accent: '#c65911',
  border: '#f4b183',
  codeBackground: '#fdf3eb',
  headingColor: '#833c0c',
  headingWeight: 700,
  headingSizes: [26, 20, 16, 14, 12, 11],
  bodySize: 12,
  lineHeight: 1.35,
});

export const sliceTheme = buildTheme({
  id: 'slice',
  name: 'Slice',
  description: 'Microsoft Office Slice theme with bold blue accents.',
  bodyFont: 'Calibri',
  headingFont: 'Segoe UI',
  primary: '#0563c1',
  text: '#1f4e79',
  accent: '#5b9bd5',
  border: '#9dc3e6',
  codeBackground: '#eef5fc',
  headingColor: '#1f4e79',
  headingWeight: 700,
  headingSizes: [28, 21, 16, 14, 12, 11],
  bodySize: 11,
  lineHeight: 1.25,
});

export const wispTheme = buildTheme({
  id: 'wisp',
  name: 'Wisp',
  description: 'Microsoft Office Wisp light, airy document styling.',
  bodyFont: 'Calibri',
  headingFont: 'Calibri',
  primary: '#838953',
  text: '#595959',
  accent: '#c3d69b',
  border: '#d6dce4',
  codeBackground: '#f7f7f7',
  headingColor: '#4f6228',
  headingWeight: 600,
  headingSizes: [26, 20, 16, 13, 12, 11],
  bodySize: 11,
  lineHeight: 1.3,
});

export const bandedTheme = buildTheme({
  id: 'banded',
  name: 'Banded',
  description: 'Banded Microsoft business report template.',
  bodyFont: 'Calibri',
  headingFont: 'Calibri',
  primary: '#1f4e79',
  text: '#262626',
  accent: '#2e75b6',
  border: '#bdd7ee',
  codeBackground: '#deebf7',
  headingColor: '#1f4e79',
  headingWeight: 700,
  headingSizes: [24, 18, 15, 13, 12, 11],
  bodySize: 11,
  lineHeight: 1.2,
});

export const dividendTheme = buildTheme({
  id: 'dividend',
  name: 'Dividend',
  description: 'Financial and dividend-style Microsoft report template.',
  bodyFont: 'Cambria',
  headingFont: 'Calibri',
  primary: '#375623',
  text: '#1f1f1f',
  accent: '#548235',
  border: '#a9d08e',
  codeBackground: '#e2efda',
  headingColor: '#375623',
  headingWeight: 700,
  headingSizes: [24, 18, 15, 13, 12, 11],
  bodySize: 11,
  lineHeight: 1.25,
});

export const whitepaperTheme = buildTheme({
  id: 'whitepaper',
  name: 'Whitepaper',
  description: 'Microsoft-style white paper with Cambria body text.',
  bodyFont: 'Cambria',
  headingFont: 'Calibri',
  primary: '#1f4e79',
  text: '#000000',
  accent: '#5b9bd5',
  border: '#d9d9d9',
  codeBackground: '#f2f2f2',
  headingColor: '#1f4e79',
  headingWeight: 700,
  headingSizes: [24, 18, 14, 12, 11, 10],
  bodySize: 11,
  lineHeight: 1.35,
});

export const resumeTheme = buildTheme({
  id: 'resume',
  name: 'Resume',
  description: 'Clean Microsoft Word resume and CV template.',
  bodyFont: 'Calibri',
  headingFont: 'Calibri',
  primary: '#2f5496',
  text: '#404040',
  accent: '#5b9bd5',
  border: '#d6dce4',
  codeBackground: '#f2f2f2',
  headingColor: '#2f5496',
  headingWeight: 700,
  headingSizes: [22, 14, 12, 11, 10, 10],
  bodySize: 10,
  lineHeight: 1.2,
});

export const agendaTheme = buildTheme({
  id: 'agenda',
  name: 'Agenda',
  description: 'Microsoft Word meeting agenda template.',
  bodyFont: 'Segoe UI',
  headingFont: 'Segoe UI',
  primary: '#0078d4',
  text: '#323130',
  accent: '#50e6ff',
  border: '#c8c6c4',
  codeBackground: '#f3f2f1',
  headingColor: '#0078d4',
  headingWeight: 600,
  headingSizes: [22, 16, 13, 12, 11, 10],
  bodySize: 10,
  lineHeight: 1.3,
});

export const brochureTheme = buildTheme({
  id: 'brochure',
  name: 'Brochure',
  description: 'Microsoft marketing brochure and flyer template.',
  bodyFont: 'Calibri',
  headingFont: 'Segoe UI',
  primary: '#c45911',
  text: '#404040',
  accent: '#ed7d31',
  border: '#f8cbad',
  codeBackground: '#fce4d6',
  headingColor: '#c45911',
  headingWeight: 700,
  headingSizes: [30, 22, 16, 13, 12, 11],
  bodySize: 11,
  lineHeight: 1.25,
});

export const formalLetterTheme = buildTheme({
  id: 'formal-letter',
  name: 'Formal Letter',
  description: 'Traditional Microsoft formal business letter.',
  bodyFont: 'Times New Roman',
  headingFont: 'Times New Roman',
  primary: '#000000',
  text: '#000000',
  accent: '#595959',
  border: '#a6a6a6',
  codeBackground: '#f2f2f2',
  headingColor: '#000000',
  headingWeight: 700,
  headingSizes: [16, 14, 12, 12, 11, 11],
  bodySize: 12,
  lineHeight: 1.15,
});

export const builtinThemes: readonly Theme[] = [
  minimalTheme,
  modernTheme,
  githubTheme,
  technicalTheme,
  corporateTheme,
  elegantTheme,
  documentationTheme,
  spectrumTheme,
  coralTheme,
  spearmintTheme,
  tropicTheme,
  plumTheme,
  geometricTheme,
  writerTheme,
  academicTheme,
  newsletterTheme,
  slateTheme,
  sunsetTheme,
  forestTheme,
  paperTheme,
  midnightTheme,
  meetingTheme,
  proposalTheme,
  officeTheme,
  facetTheme,
  ionTheme,
  organicTheme,
  retrospectTheme,
  sliceTheme,
  wispTheme,
  bandedTheme,
  dividendTheme,
  whitepaperTheme,
  resumeTheme,
  agendaTheme,
  brochureTheme,
  formalLetterTheme,
];

export function getBuiltinTheme(id: string): Theme | undefined {
  return builtinThemes.find((theme) => theme.metadata.id === id);
}
