#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { compileDocument, type CompileOptions } from '../compile.js';
import { watchDocument } from '../watch.js';
import type { ExportFormat, PageSizeName, PageOrientation } from '@seamdoc/types';

const program = new Command();

program
  .name('seamdoc')
  .description('Seamdoc Command Line Interface — compile Markdown to styled PDF and Word documents')
  .version('0.1.0');

program
  .command('compile')
  .description('Compile a Markdown file into a styled document')
  .argument('<file>', 'Path to the source Markdown file')
  .option('-o, --output <path>', 'Destination output path')
  .option('-f, --format <docx|pdf>', 'Output format (default: docx)')
  .option(
    '-t, --theme <id_or_path>',
    'Theme ID (built-in) or path to custom JSON theme file (default: minimal)',
  )
  .option('-l, --template <path>', 'Path to Word template document (.docx)')
  .option('-w, --watch', 'Watch input file for changes and compile automatically')
  .option('--font-family <name>', 'Default body font family override')
  .option('--font-size <pt>', 'Default body font size in points', (val) => parseFloat(val))
  .option('--line-spacing <spacing>', 'Line spacing multiplier override', (val) => parseFloat(val))
  .option('--paragraph-spacing <spacing>', 'Space after paragraphs in points', (val) =>
    parseFloat(val),
  )
  .option('--page-size <A4|A3|A5|Letter|Legal>', 'Page size configuration')
  .option('--orientation <portrait|landscape>', 'Page orientation')
  .option('--margins <top,right,bottom,left>', 'Margins in points')
  .option('--title <title>', 'Document title metadata override')
  .option('--author <author>', 'Document author metadata override')
  .option('--description <description>', 'Document description metadata override')
  .action(async (file, options) => {
    const inputPath = path.resolve(file);
    const compileOptions: CompileOptions = {};

    if (options.theme !== undefined) {
      compileOptions.theme = options.theme;
    }
    if (options.template !== undefined) {
      compileOptions.template = options.template;
    }
    if (options.format !== undefined) {
      compileOptions.format = options.format as ExportFormat;
    }
    if (options.output !== undefined) {
      compileOptions.output = options.output;
    }
    if (options.fontFamily !== undefined) {
      compileOptions.fontFamily = options.fontFamily;
    }
    if (options.fontSize !== undefined) {
      compileOptions.fontSize = options.fontSize;
    }
    if (options.lineSpacing !== undefined) {
      compileOptions.lineSpacing = options.lineSpacing;
    }
    if (options.paragraphSpacing !== undefined) {
      compileOptions.paragraphSpacing = options.paragraphSpacing;
    }
    if (options.pageSize !== undefined) {
      compileOptions.pageSize = options.pageSize as PageSizeName;
    }
    if (options.orientation !== undefined) {
      compileOptions.orientation = options.orientation as PageOrientation;
    }
    if (options.margins !== undefined) {
      compileOptions.margins = options.margins;
    }
    if (options.title !== undefined) {
      compileOptions.title = options.title;
    }
    if (options.author !== undefined) {
      compileOptions.author = options.author;
    }
    if (options.description !== undefined) {
      compileOptions.description = options.description;
    }

    if (options.watch) {
      console.log(`[seamdoc] Watching file ${file} for changes...`);
      watchDocument(
        inputPath,
        compileOptions,
        () => console.log(`[seamdoc] File changed. Compiling...`),
        (outputPath) => console.log(`[seamdoc] Compilation successful. Written to: ${outputPath}`),
        (error) => console.error(`[seamdoc] Compilation failed: ${error.message}`),
      );

      // Keep process alive in watch mode
      process.on('SIGINT', () => {
        console.log('\n[seamdoc] Watcher stopped.');
        process.exit(0);
      });
    } else {
      try {
        const outPath = await compileDocument(inputPath, compileOptions);
        console.log(`[seamdoc] Compilation successful. Written to: ${outPath}`);
      } catch (error) {
        console.error(`[seamdoc] Error: ${(error as Error).message}`);
        process.exit(1);
      }
    }
  });

program.parse(process.argv);
