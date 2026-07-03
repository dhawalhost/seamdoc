import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shikiVitestConfig } from '../config/vitest.shiki.js';

const highlighterEntry = path.join(fileURLToPath(new URL('..', import.meta.url)), 'src/index.ts');

export default defineConfig({
  resolve: {
    alias: {
      '@seamdoc/highlighter': highlighterEntry,
    },
  },
  test: {
    ...shikiVitestConfig,
    setupFiles: ['./src/vitest.setup.ts'],
  },
});
