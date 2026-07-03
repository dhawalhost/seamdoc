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
  readonly codeFont: string;
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
    typography: { body: seed.bodyFont, heading: seed.headingFont, code: seed.codeFont },
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
      fontFamily: seed.codeFont,
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
  };
}

export const minimalTheme = buildTheme({
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean, unobtrusive defaults for any document.',
  bodyFont: 'Calibri',
  headingFont: 'Calibri',
  codeFont: 'Consolas',
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
  bodyFont: 'Segoe UI',
  headingFont: 'Segoe UI',
  codeFont: 'Cascadia Code',
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
  bodyFont: 'Segoe UI',
  headingFont: 'Segoe UI',
  codeFont: 'Consolas',
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
  bodyFont: 'Arial',
  headingFont: 'Arial',
  codeFont: 'Courier New',
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
  bodyFont: 'Georgia',
  headingFont: 'Arial',
  codeFont: 'Consolas',
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
  bodyFont: 'Garamond',
  headingFont: 'Garamond',
  codeFont: 'Consolas',
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
  bodyFont: 'Verdana',
  headingFont: 'Verdana',
  codeFont: 'Consolas',
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

export const builtinThemes: readonly Theme[] = [
  minimalTheme,
  modernTheme,
  githubTheme,
  technicalTheme,
  corporateTheme,
  elegantTheme,
  documentationTheme,
];

export function getBuiltinTheme(id: string): Theme | undefined {
  return builtinThemes.find((theme) => theme.metadata.id === id);
}
