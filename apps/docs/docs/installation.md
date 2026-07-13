# Installation & Getting Started

Seamdoc can be run locally or built for production deployment.

## Prerequisites

- **Node.js**: `>=22.12`
- **pnpm**: Package manager

## Setup

Clone the repository and install workspace dependencies:

```bash
git clone https://github.com/seamdoc/seamdoc.git
cd seamdoc
pnpm install
```

## Running the Web App

Start the developer server for the web interface:

```bash
pnpm --filter @seamdoc/web dev
```

Open `http://localhost:5173` in your browser.

## Running the Docs Site

To run the documentation site locally:

```bash
pnpm --filter @seamdoc/docs dev
```

Open the local URL displayed in the terminal.
