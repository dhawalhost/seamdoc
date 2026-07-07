import fs from 'fs/promises';
import path from 'path';
import { ExporterRegistry } from '@seamdoc/core';
import { docxExporter } from '@seamdoc/exporter-docx';
import { pdfExporter } from '@seamdoc/exporter-pdf';
import { htmlExporter } from '@seamdoc/exporter-html';
import { pptxExporter } from '@seamdoc/exporter-pptx';
import { odtExporter } from '@seamdoc/exporter-odt';
import { getBuiltinTheme, validateTheme, type Theme } from '@seamdoc/themes';
import { importTemplate } from '@seamdoc/templates';
import { parseMarkdown } from '@seamdoc/parser';
import { fromMdast, validateDocument, type SdmDocument } from '@seamdoc/semantic-model';
import { layoutDocument, validateRenderTree } from '@seamdoc/renderer';
import { importHtml, importMdx, importAsciidoc } from '@seamdoc/importers';
import { DEFAULT_DOCUMENT_METADATA, DEFAULT_DOCUMENT_SETTINGS } from '@seamdoc/shared';
import type {
  DocumentSettings,
  DocumentMetadata,
  ExportFormat,
  PageSizeName,
  PageOrientation,
} from '@seamdoc/types';

export interface CompileOptions {
  theme?: string;
  template?: string;
  format?: ExportFormat;
  output?: string;
  fontFamily?: string;
  fontSize?: number;
  lineSpacing?: number;
  paragraphSpacing?: number;
  pageSize?: PageSizeName;
  orientation?: PageOrientation;
  margins?: string; // Comma-separated: top,right,bottom,left
  title?: string;
  author?: string;
  description?: string;
}

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

export async function compileDocument(inputPath: string, options: CompileOptions): Promise<string> {
  // 1. Read input markdown file
  let content: string;
  try {
    content = await fs.readFile(inputPath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read input file: ${(error as Error).message}`);
  }

  // 2. Resolve Theme
  let themeObj: Theme | undefined;
  const themeArg = options.theme || 'minimal';
  if (
    themeArg.endsWith('.json') ||
    themeArg.includes('/') ||
    themeArg.includes('\\') ||
    themeArg.includes('.')
  ) {
    try {
      const themeContent = await fs.readFile(themeArg, 'utf8');
      const parsed = JSON.parse(themeContent);
      const val = validateTheme(parsed);
      if (!val.valid || val.theme === null) {
        throw new Error(val.errors.join('; '));
      }
      themeObj = val.theme;
    } catch (error) {
      throw new Error(
        `Failed to load custom theme from "${themeArg}": ${(error as Error).message}`,
      );
    }
  } else {
    themeObj = getBuiltinTheme(themeArg);
    if (!themeObj) {
      throw new Error(`Built-in theme "${themeArg}" not found.`);
    }
  }

  // 3. Resolve Template
  let templateObj = undefined;
  if (options.template) {
    try {
      const templateBuffer = await fs.readFile(options.template);
      const profile = await importTemplate(templateBuffer);
      templateObj = {
        stylesXml: profile.stylesXml,
        mapping: profile.mapping,
      };
    } catch (error) {
      throw new Error(
        `Failed to load template from "${options.template}": ${(error as Error).message}`,
      );
    }
  }

  // 4. Resolve Settings Overrides
  const settings: Mutable<Partial<DocumentSettings>> = {};
  if (options.fontFamily) {
    settings.fontFamily = options.fontFamily;
  }
  if (options.fontSize) {
    settings.fontSize = options.fontSize;
  }
  if (options.lineSpacing) {
    settings.lineSpacing = options.lineSpacing;
  }
  if (options.paragraphSpacing) {
    settings.paragraphSpacing = options.paragraphSpacing;
  }
  if (options.pageSize) {
    settings.pageSize = options.pageSize;
  }
  if (options.orientation) {
    settings.orientation = options.orientation;
  }
  if (options.margins) {
    const parts = options.margins.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      settings.margins = {
        top: parts[0]!,
        right: parts[1]!,
        bottom: parts[2]!,
        left: parts[3]!,
      };
    } else {
      throw new Error(
        'Margins must be specified as four comma-separated numbers: top,right,bottom,left',
      );
    }
  }

  // 5. Resolve Metadata Overrides
  const metadata: Mutable<Partial<DocumentMetadata>> = {};
  if (options.title) {
    metadata.title = options.title;
  }
  if (options.author) {
    metadata.author = options.author;
  }
  if (options.description) {
    metadata.description = options.description;
  }

  // 6. Build SdmDocument from corresponding parser
  let sdmDoc: SdmDocument;
  const ext = path.extname(inputPath).toLowerCase();

  const finalMetadata = { ...DEFAULT_DOCUMENT_METADATA, ...metadata };

  if (ext === '.html' || ext === '.htm') {
    sdmDoc = importHtml(content, finalMetadata);
  } else if (ext === '.adoc' || ext === '.asciidoc') {
    sdmDoc = importAsciidoc(content, finalMetadata);
  } else if (ext === '.mdx') {
    sdmDoc = importMdx(content, finalMetadata);
  } else {
    // Default to markdown
    const ast = parseMarkdown(content);
    sdmDoc = fromMdast(ast, { metadata: finalMetadata });
  }

  // 7. Validate SdmDocument
  const validation = validateDocument(sdmDoc);
  if (!validation.valid) {
    const details = validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ');
    throw new Error(`Semantic document validation failed: ${details}`);
  }

  // 8. Run Layout Engine
  const resolvedSettings: DocumentSettings = { ...DEFAULT_DOCUMENT_SETTINGS, ...settings };
  const renderDocument = layoutDocument({
    document: sdmDoc,
    theme: themeObj,
    settings: resolvedSettings,
  });

  // 9. Validate Render Tree
  const treeValidation = validateRenderTree(renderDocument);
  if (!treeValidation.valid) {
    const details = treeValidation.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('; ');
    throw new Error(`Render tree validation failed: ${details}`);
  }

  // 10. Setup Exporter Registry
  const registry = new ExporterRegistry();
  registry.register(docxExporter);
  registry.register(pdfExporter);
  registry.register(htmlExporter);
  registry.register(pptxExporter);
  registry.register(odtExporter);

  // 11. Find Exporter & Execute
  const format = options.format || 'docx';
  const exporter = registry.find(format);
  if (!exporter) {
    throw new Error(`No exporter registered for format "${format}".`);
  }

  const resolvedFilename =
    options.output ||
    path.format({
      ...path.parse(inputPath),
      base: '',
      ext: `.${format}`,
    });

  const exportResult = await exporter.export(renderDocument, {
    filename: path.basename(resolvedFilename),
    metadata: sdmDoc.metadata,
    ...(templateObj ? { template: templateObj } : {}),
  });

  // 12. Write to disk
  try {
    await fs.mkdir(path.dirname(resolvedFilename), { recursive: true });
    await fs.writeFile(resolvedFilename, new Uint8Array(exportResult.data));
  } catch (error) {
    throw new Error(
      `Failed to write output file to "${resolvedFilename}": ${(error as Error).message}`,
    );
  }

  return resolvedFilename;
}
