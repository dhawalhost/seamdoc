#!/usr/bin/env node
/**
 * One-shot scaffolder for Seamdoc placeholder packages (Phase 0).
 * Creates package.json, tsconfig, eslint config, a stub entry point, and a
 * smoke test for every library package defined in
 * docs/02-architecture/folder-structure.md.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

const packages = [
  { dir: 'packages/types', name: '@seamdoc/types', desc: 'Shared TypeScript types' },
  { dir: 'packages/utils', name: '@seamdoc/utils', desc: 'Generic utility functions' },
  {
    dir: 'packages/shared',
    name: '@seamdoc/shared',
    desc: 'Shared constants, enums, and defaults',
  },
  { dir: 'packages/parser', name: '@seamdoc/parser', desc: 'Markdown to mdast parsing' },
  { dir: 'packages/ast', name: '@seamdoc/ast', desc: 'AST node definitions and guards' },
  {
    dir: 'packages/semantic-model',
    name: '@seamdoc/semantic-model',
    desc: 'Semantic Document Model (SDM) and mdast conversion',
  },
  {
    dir: 'packages/renderer',
    name: '@seamdoc/renderer',
    desc: 'Document engine, render tree, and layout engine',
  },
  {
    dir: 'packages/themes',
    name: '@seamdoc/themes',
    desc: 'Theme schema, validation, and built-in themes',
  },
  { dir: 'packages/core', name: '@seamdoc/core', desc: 'Pipeline orchestration' },
  { dir: 'packages/exporters/docx', name: '@seamdoc/exporter-docx', desc: 'DOCX exporter' },
];

for (const pkg of packages) {
  const dir = join(root, pkg.dir);
  const src = join(dir, 'src');
  mkdirSync(src, { recursive: true });

  const toConfig = relative(dir, join(root, 'packages/config'));

  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: pkg.name,
        version: '0.1.0',
        description: pkg.desc,
        license: 'MIT',
        type: 'module',
        main: './dist/index.js',
        types: './dist/index.d.ts',
        exports: { '.': { types: './dist/index.d.ts', import: './dist/index.js' } },
        files: ['dist'],
        scripts: {
          build: 'tsc -p tsconfig.json',
          typecheck: 'tsc -p tsconfig.json --noEmit',
          test: 'vitest run --passWithNoTests',
          lint: 'eslint src',
        },
      },
      null,
      2,
    ) + '\n',
  );

  writeFileSync(
    join(dir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: `${toConfig}/tsconfig.base.json`,
        compilerOptions: { outDir: 'dist', rootDir: 'src' },
        include: ['src'],
      },
      null,
      2,
    ) + '\n',
  );

  writeFileSync(
    join(dir, 'eslint.config.mjs'),
    `import base from '${toConfig}/eslint.config.base.mjs';\n\nexport default [...base];\n`,
  );

  const indexPath = join(src, 'index.ts');
  if (!existsSync(indexPath)) {
    writeFileSync(
      indexPath,
      `/** ${pkg.desc}. Placeholder entry point; implemented in later phases. */\nexport const PACKAGE_NAME = '${pkg.name}';\n`,
    );
  }

  const testPath = join(src, 'index.test.ts');
  if (!existsSync(testPath)) {
    writeFileSync(
      testPath,
      `import { describe, expect, it } from 'vitest';\nimport { PACKAGE_NAME } from './index.js';\n\ndescribe('${pkg.name}', () => {\n  it('exposes its package name', () => {\n    expect(PACKAGE_NAME).toBe('${pkg.name}');\n  });\n});\n`,
    );
  }

  console.log(`scaffolded ${pkg.name}`);
}
