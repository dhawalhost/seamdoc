/**
 * Shared TypeScript types used across Seamdoc packages.
 *
 * Cross-cutting contracts only: document settings, metadata, and the
 * exporter SDK surface (docs/02-architecture/exporter-sdk.md).
 */

export type PageOrientation = 'portrait' | 'landscape';

export type PageSizeName = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal';

/** All physical measurements are expressed in points (pt). */
export interface PageDimensions {
  readonly width: number;
  readonly height: number;
}

export interface PageMargins {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/**
 * User-facing document configuration, resolved before rendering.
 * Typography fields are overrides layered on top of the active theme
 * (docs/02-architecture/theme-engine.md, theme resolution order); null means
 * "use the theme value".
 */
export interface DocumentSettings {
  readonly pageSize: PageSizeName;
  readonly orientation: PageOrientation;
  readonly margins: PageMargins;
  /** Static header text; empty string disables the header. */
  readonly header: string;
  /** Static footer text; empty string disables the footer. */
  readonly footer: string;
  readonly pageNumbers: boolean;
  /** Body font family override; null uses the theme font. */
  readonly fontFamily: string | null;
  /** Body font size override in points; null uses the theme size. */
  readonly fontSize: number | null;
  /** Line spacing multiplier override; null uses the theme value. */
  readonly lineSpacing: number | null;
  /** Space after paragraphs in points; null uses the theme value. */
  readonly paragraphSpacing: number | null;
  readonly customPageSize?: PageDimensions | null;
  readonly pageBorder?: PageBorder | null;
}

export interface PageBorder {
  readonly color: string;
  readonly width: number;
  readonly style: 'solid' | 'dashed' | 'double' | 'none';
}

export interface DocumentMetadata {
  readonly title: string;
  readonly author: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly language: string;
  /** ISO 8601 timestamp. Fixed values keep output deterministic. */
  readonly createdAt: string;
  /** ISO 8601 timestamp. Fixed values keep output deterministic. */
  readonly updatedAt: string;
}

export type ExportFormat = 'docx' | 'pdf' | 'html' | 'pptx' | 'odt' | 'epub';

/** Semantic slots a template can map to native document styles. */
export type TemplateMappableNode =
  'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'paragraph' | 'quote' | 'code' | 'table';

/**
 * Format-neutral template data exporters may honor
 * (docs/02-architecture/template-engine.md). Produced by the template
 * engine; exporters that have no use for it ignore it.
 */
export interface ExportTemplate {
  /** Raw styles.xml from the imported template. */
  readonly stylesXml: string;
  /** Semantic-node → native-style-id mapping. */
  readonly mapping: Partial<Readonly<Record<TemplateMappableNode, string>>>;
}

export interface ExportSettings {
  readonly filename: string;
  readonly metadata: DocumentMetadata;
  readonly template?: ExportTemplate;
}

export interface ExportResult {
  readonly filename: string;
  readonly mimeType: string;
  readonly data: ArrayBuffer;
}

/**
 * Exporter contract (docs/02-architecture/exporter-sdk.md). The render
 * document type is owned by the renderer package; exporters receive it as an
 * opaque, fully resolved structure.
 */
export interface Exporter<TRenderDocument> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  supports(format: ExportFormat): boolean;
  export(document: TRenderDocument, settings: ExportSettings): Promise<ExportResult>;
}

/** Structured, recoverable pipeline diagnostics. */
export interface PipelineWarning {
  readonly stage: string;
  readonly message: string;
}
