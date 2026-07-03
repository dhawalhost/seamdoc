/**
 * Theme schema and validation (docs/02-architecture/theme-engine.md).
 * Themes are declarative, serializable JSON. Invalid themes never reach the
 * renderer.
 */

import { z } from 'zod';

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Colors must be #RRGGBB hex values');

const spacingSchema = z.object({
  before: z.number().min(0),
  after: z.number().min(0),
});

const textStyleSchema = z.object({
  fontFamily: z.string().min(1),
  fontSize: z.number().positive(),
  fontWeight: z.number().int().min(100).max(900),
  italic: z.boolean(),
  color: colorSchema,
});

const alignmentSchema = z.enum(['left', 'center', 'right', 'justify']);

const headingStyleSchema = textStyleSchema.extend({
  alignment: alignmentSchema,
  spacing: spacingSchema,
});

export const themeSchema = z.object({
  schemaVersion: z.literal(1),
  metadata: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    version: z.string().min(1),
    author: z.string(),
    description: z.string(),
    license: z.string(),
  }),
  typography: z.object({
    body: z.string().min(1),
    heading: z.string().min(1),
    code: z.string().min(1),
  }),
  colors: z.object({
    primary: colorSchema,
    text: colorSchema,
    background: colorSchema,
    border: colorSchema,
    accent: colorSchema,
    codeBackground: colorSchema,
  }),
  headings: z.object({
    h1: headingStyleSchema,
    h2: headingStyleSchema,
    h3: headingStyleSchema,
    h4: headingStyleSchema,
    h5: headingStyleSchema,
    h6: headingStyleSchema,
  }),
  paragraph: textStyleSchema.extend({
    alignment: alignmentSchema,
    lineHeight: z.number().positive(),
    spacing: spacingSchema,
  }),
  list: z.object({
    indent: z.number().min(0),
    spacing: spacingSchema,
  }),
  table: z.object({
    headerBackground: colorSchema,
    headerColor: colorSchema,
    headerFontWeight: z.number().int().min(100).max(900),
    borderColor: colorSchema,
    borderWidth: z.number().min(0),
    cellPadding: z.number().min(0),
  }),
  image: z.object({
    alignment: alignmentSchema,
    maxWidth: z.number().positive(),
    spacing: spacingSchema,
  }),
  code: z.object({
    fontFamily: z.string().min(1),
    fontSize: z.number().positive(),
    color: colorSchema,
    background: colorSchema,
    padding: z.number().min(0),
    spacing: spacingSchema,
  }),
  quote: z.object({
    borderColor: colorSchema,
    borderWidth: z.number().min(0),
    color: colorSchema,
    italic: z.boolean(),
    indent: z.number().min(0),
    spacing: spacingSchema,
  }),
  link: z.object({
    color: colorSchema,
    underline: z.boolean(),
  }),
  horizontalRule: z.object({
    color: colorSchema,
    thickness: z.number().positive(),
    spacing: spacingSchema,
  }),
});

export type Theme = z.infer<typeof themeSchema>;
export type ThemeHeadingStyle = Theme['headings']['h1'];
export type ThemeTextStyle = z.infer<typeof textStyleSchema>;
export type ThemeAlignment = z.infer<typeof alignmentSchema>;

export interface ThemeValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly theme: Theme | null;
}

export function validateTheme(input: unknown): ThemeValidationResult {
  const result = themeSchema.safeParse(input);
  if (result.success) {
    return { valid: true, errors: [], theme: result.data };
  }
  return {
    valid: false,
    errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    theme: null,
  };
}
