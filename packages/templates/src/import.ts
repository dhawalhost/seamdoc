/**
 * DOCX template import (docs/02-architecture/template-engine.md).
 * Pipeline: import → analyze → extract styles → map styles → validate →
 * template profile. The original template is never modified.
 */

import JSZip from 'jszip';
import type { DocumentSettings, PageSizeName } from '@seamdoc/types';
import { PAGE_SIZES } from '@seamdoc/shared';
import type {
  MappableNode,
  StyleMapping,
  TemplateProfile,
  TemplateValidationIssue,
  WordStyle,
  WordStyleType,
} from './types.js';

const TWIPS_PER_POINT = 20;

export class TemplateImportError extends Error {
  constructor(
    message: string,
    readonly issues: readonly TemplateValidationIssue[] = [],
  ) {
    super(message);
    this.name = 'TemplateImportError';
  }
}

export interface ImportTemplateOptions {
  readonly name?: string;
  readonly source?: string;
}

export async function importTemplate(
  data: ArrayBuffer | Uint8Array,
  options: ImportTemplateOptions = {},
): Promise<TemplateProfile> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(data);
  } catch {
    throw new TemplateImportError('The file is not a valid DOCX archive (corrupt ZIP).');
  }

  const stylesFile = zip.file('word/styles.xml');
  const documentFile = zip.file('word/document.xml');
  if (stylesFile === null || documentFile === null) {
    throw new TemplateImportError(
      'The archive is missing word/styles.xml or word/document.xml; it is not a Word document.',
    );
  }

  const stylesXml = await stylesFile.async('string');
  const documentXml = await documentFile.async('string');

  const styles = extractStyles(stylesXml);
  if (styles.length === 0) {
    throw new TemplateImportError('The template defines no styles.');
  }

  const coreFile = zip.file('docProps/core.xml');
  const coreXml = coreFile === null ? '' : await coreFile.async('string');

  const profile: TemplateProfile = {
    version: 1,
    metadata: {
      name: options.name ?? readCoreProperty(coreXml, 'dc:title') ?? 'Imported template',
      description: readCoreProperty(coreXml, 'dc:description') ?? '',
      author: readCoreProperty(coreXml, 'dc:creator') ?? '',
      company: '',
      source: options.source ?? '',
      createdAt: readCoreProperty(coreXml, 'dcterms:created') ?? '',
    },
    styles,
    mapping: autoMapStyles(styles),
    pageSettings: extractPageSettings(documentXml),
    stylesXml,
    hasHeader: documentXml.includes('<w:headerReference'),
    hasFooter: documentXml.includes('<w:footerReference'),
  };

  // Final pipeline stage: validate before handing out the profile.
  const errors = validateTemplateProfile(profile).filter((issue) => issue.severity === 'error');
  if (errors.length > 0) {
    throw new TemplateImportError(
      `The template failed validation: ${errors.map((issue) => issue.message).join(' ')}`,
      errors,
    );
  }
  return profile;
}

/** Parses w:style elements from styles.xml without a full XML DOM. */
export function extractStyles(stylesXml: string): readonly WordStyle[] {
  const styles: WordStyle[] = [];
  const stylePattern = /<w:style\s+([^>]*)>([\s\S]*?)<\/w:style>/g;
  for (const match of stylesXml.matchAll(stylePattern)) {
    const attributes = match[1] ?? '';
    const body = match[2] ?? '';
    const type = /w:type="([^"]+)"/.exec(attributes)?.[1];
    const id = /w:styleId="([^"]+)"/.exec(attributes)?.[1];
    const name = /<w:name\s+w:val="([^"]+)"/.exec(body)?.[1];
    if (id !== undefined && isWordStyleType(type)) {
      styles.push({ id, name: name ?? id, type });
    }
  }
  return styles;
}

function isWordStyleType(type: string | undefined): type is WordStyleType {
  return type === 'paragraph' || type === 'character' || type === 'table' || type === 'numbering';
}

/**
 * Automatic style mapping by conventional Word style names
 * (docs/02-architecture/template-engine.md, automatic mapping). Unmapped
 * slots stay empty for the user to resolve.
 */
export function autoMapStyles(styles: readonly WordStyle[]): StyleMapping {
  const mapping: Partial<Record<MappableNode, string>> = {};

  const byName = (predicate: (name: string) => boolean, type: WordStyleType = 'paragraph') =>
    styles.find((style) => style.type === type && predicate(style.name.toLowerCase()));

  for (let level = 1 as 1 | 2 | 3 | 4 | 5 | 6; level <= 6; level++) {
    const style = byName((name) => name === `heading ${level}` || name === `heading${level}`);
    if (style !== undefined) {
      mapping[`h${level}` as MappableNode] = style.id;
    }
  }

  const paragraph = byName((name) => name === 'normal' || name === 'body text');
  if (paragraph !== undefined) {
    mapping.paragraph = paragraph.id;
  }

  const quote = byName((name) => name === 'quote' || name === 'intense quote' || name === 'block quote');
  if (quote !== undefined) {
    mapping.quote = quote.id;
  }

  const code = byName(
    (name) => name.includes('code') || name === 'htmlpreformatted' || name === 'plain text',
  );
  if (code !== undefined) {
    mapping.code = code.id;
  }

  const table = styles.find(
    (style) => style.type === 'table' && style.name.toLowerCase() !== 'normal table',
  );
  if (table !== undefined) {
    mapping.table = table.id;
  }

  return mapping;
}

/** Returns the capture of the LAST match: the body-level (final) sectPr. */
function lastMatch(pattern: RegExp, xml: string): string | undefined {
  let result: string | undefined;
  for (const match of xml.matchAll(pattern)) {
    result = match[1];
  }
  return result;
}

/** Reads page size, orientation, and margins from the last (body) sectPr. */
export function extractPageSettings(documentXml: string): Partial<DocumentSettings> {
  const settings: {
    -readonly [K in keyof DocumentSettings]?: DocumentSettings[K];
  } = {};

  const pgSz = lastMatch(/<w:pgSz\s+([^/>]*)\/?>/g, documentXml);
  if (pgSz !== undefined) {
    const width = twipsAttr(pgSz, 'w:w');
    const height = twipsAttr(pgSz, 'w:h');
    const landscape = pgSz.includes('w:orient="landscape"');
    if (width !== null && height !== null) {
      settings.orientation = landscape ? 'landscape' : 'portrait';
      const match = matchPageSize(landscape ? height : width, landscape ? width : height);
      if (match !== null) {
        settings.pageSize = match;
      }
    }
  }

  const pgMar = lastMatch(/<w:pgMar\s+([^/>]*)\/?>/g, documentXml);
  if (pgMar !== undefined) {
    const top = twipsAttr(pgMar, 'w:top');
    const right = twipsAttr(pgMar, 'w:right');
    const bottom = twipsAttr(pgMar, 'w:bottom');
    const left = twipsAttr(pgMar, 'w:left');
    if (top !== null && right !== null && bottom !== null && left !== null) {
      settings.margins = { top, right, bottom, left };
    }
  }

  return settings;
}

function twipsAttr(attributes: string, name: string): number | null {
  const value = new RegExp(`${name}="(\\d+)"`).exec(attributes)?.[1];
  if (value === undefined) {
    return null;
  }
  return Number(value) / TWIPS_PER_POINT;
}

function matchPageSize(widthPt: number, heightPt: number): PageSizeName | null {
  for (const [name, dimensions] of Object.entries(PAGE_SIZES)) {
    if (Math.abs(dimensions.width - widthPt) < 2 && Math.abs(dimensions.height - heightPt) < 2) {
      return name as PageSizeName;
    }
  }
  return null;
}

function readCoreProperty(coreXml: string, tag: string): string | null {
  const value = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`).exec(coreXml)?.[1];
  return value === undefined || value === '' ? null : value;
}

/** Validates a profile before use; errors block rendering, warnings do not. */
export function validateTemplateProfile(
  profile: TemplateProfile,
): readonly TemplateValidationIssue[] {
  const issues: TemplateValidationIssue[] = [];
  if (profile.styles.length === 0) {
    issues.push({ severity: 'error', message: 'Template profile contains no styles.' });
  }
  if (profile.stylesXml === '') {
    issues.push({ severity: 'error', message: 'Template profile is missing styles.xml content.' });
  }
  const styleIds = new Set(profile.styles.map((style) => style.id));
  for (const [node, styleId] of Object.entries(profile.mapping)) {
    if (styleId !== undefined && !styleIds.has(styleId)) {
      issues.push({
        severity: 'error',
        message: `Mapping for "${node}" references unknown style "${styleId}".`,
      });
    }
  }
  if (profile.mapping.paragraph === undefined) {
    issues.push({ severity: 'warning', message: 'No paragraph style mapped; theme styling is used.' });
  }
  return issues;
}
