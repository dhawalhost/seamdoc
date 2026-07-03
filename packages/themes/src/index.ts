/** Theme engine: schema, validation, and built-in themes. */

export {
  themeSchema,
  validateTheme,
  type Theme,
  type ThemeAlignment,
  type ThemeHeadingStyle,
  type ThemeTextStyle,
  type ThemeValidationResult,
} from './schema.js';
export {
  builtinThemes,
  getBuiltinTheme,
  minimalTheme,
  modernTheme,
  githubTheme,
  technicalTheme,
  corporateTheme,
  elegantTheme,
  documentationTheme,
} from './builtin.js';
