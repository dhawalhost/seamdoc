/**
 * Template engine types (docs/02-architecture/template-engine.md).
 * A template profile is the serializable result of importing a DOCX
 * template: extracted styles, semantic mappings, and preserved page setup.
 */

import type { DocumentSettings, ExportTemplate, TemplateMappableNode } from '@seamdoc/types';

export type WordStyleType = 'paragraph' | 'character' | 'table' | 'numbering';

export interface WordStyle {
  readonly id: string;
  readonly name: string;
  readonly type: WordStyleType;
}

/** Semantic slots that can be mapped to Word styles. */
export type MappableNode = TemplateMappableNode;

export type StyleMapping = Partial<Readonly<Record<MappableNode, string>>>;

export interface TemplateMetadata {
  readonly name: string;
  readonly description: string;
  readonly author: string;
  readonly company: string;
  readonly source: string;
  readonly createdAt: string;
}

/** Satisfies the ExportTemplate contract so exporters can consume profiles. */
export interface TemplateProfile extends ExportTemplate {
  readonly version: 1;
  readonly metadata: TemplateMetadata;
  /** All styles discovered in the template. */
  readonly styles: readonly WordStyle[];
  /** Automatic semantic-node → Word-style-id mapping. */
  readonly mapping: StyleMapping;
  /** Page setup preserved from the template (size, orientation, margins). */
  readonly pageSettings: Partial<DocumentSettings>;
  /** Raw styles.xml, embedded into exports so template styles apply. */
  readonly stylesXml: string;
  /** Whether the template defines headers/footers (informational). */
  readonly hasHeader: boolean;
  readonly hasFooter: boolean;
}

export interface TemplateValidationIssue {
  readonly severity: 'error' | 'warning';
  readonly message: string;
}
