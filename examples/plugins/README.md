# Plugin SDK example

Plugins transform the Semantic Document Model before layout (pipeline stage 7).
See `packages/plugins/src/registry.test.ts` for usage patterns.

````typescript
import { PluginRegistry, createCodeBlockPlugin } from '@seamdoc/plugins';
import { renderMarkdown } from '@seamdoc/core';

const plugins = new PluginRegistry();
plugins.register(
  createCodeBlockPlugin({
    id: 'mermaid',
    name: 'Mermaid diagrams',
    version: '1.0.0',
    language: 'mermaid',
    transformBlock: (block) => [
      {
        type: 'paragraph',
        children: [{ type: 'image', src: 'diagram.svg', alt: 'Diagram', title: null }],
      },
    ],
  }),
);

const outcome = renderMarkdown('```mermaid\ngraph TD; A-->B;\n```', { plugins });
// outcome.warnings carries recoverable plugin diagnostics
// A failing plugin is disabled; rendering continues on the prior document
````

Marketplace distribution and in-app plugin loading are deferred (ADR 0005).
