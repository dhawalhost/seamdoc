# Seamdoc

Seamdoc is an open-source, browser-based platform that transforms Markdown into
production-ready Microsoft Word documents using professional themes, reusable
templates, and a semantic rendering engine.

- **Browser first** — the core workflow runs entirely in your browser.
- **Privacy first** — documents never leave your device unless you ask.
- **Theme driven** — content and presentation are fully separated.

## Documentation

The complete specification lives in [`docs/`](docs/):

- **[User guide](docs/01-product/user-guide.md)** — toolbar icons, themes, templates, and settings
- [`docs/00-overview/`](docs/00-overview/) — vision and project doctrine
- [`docs/01-product/`](docs/01-product/) — PRD, feature list, functional requirements
- [`docs/02-architecture/`](docs/02-architecture/) — architecture documents

## Repository layout

```text
apps/        Applications (web, docs, playground)
packages/    Reusable libraries (parser, semantic-model, renderer, themes, exporters, ...)
docs/        Project documentation
examples/    Sample Markdown files, themes, and reference documents
scripts/     Automation scripts
assets/      Static assets
tests/       Repository-wide integration and e2e tests
```

## Development

Requirements: Node.js >= 22.12, pnpm 9.

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

### Run the web app

```bash
cd apps/web
pnpm dev
```

Open http://localhost:5173/. See the [user guide](docs/01-product/user-guide.md) for how to use the UI, import themes, and import Word templates.

## License

MIT
