/** Template engine: DOCX template import, style extraction, and mapping. */

export {
  autoMapStyles,
  extractPageSettings,
  extractStyles,
  importTemplate,
  TemplateImportError,
  validateTemplateProfile,
  type ImportTemplateOptions,
} from './import.js';
export type {
  MappableNode,
  StyleMapping,
  TemplateMetadata,
  TemplateProfile,
  TemplateValidationIssue,
  WordStyle,
  WordStyleType,
} from './types.js';
