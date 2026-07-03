import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type UserConfig } from 'vitest/config';

const packagesRoot = fileURLToPath(new URL('..', import.meta.url));
const highlighterEntry = path.join(packagesRoot, 'highlighter/src/index.ts');

/** Shared Vitest options for packages that run the layout pipeline with Shiki. */
export const shikiVitestConfig: UserConfig['test'] = {
  server: {
    deps: {
      inline: ['shiki', /@shikijs\/.*/],
    },
  },
};

export function withShikiSetup(setupFile: string): ReturnType<typeof defineConfig> {
  return defineConfig({
    resolve: {
      alias: {
        '@seamdoc/highlighter': highlighterEntry,
      },
    },
    test: {
      ...shikiVitestConfig,
      setupFiles: [setupFile],
    },
  });
}
