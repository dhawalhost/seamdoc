#!/usr/bin/env bash
# Repository smoke gate: build, unit tests, lint, and typecheck.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> pnpm build"
pnpm build

echo "==> pnpm test"
pnpm test

echo "==> pnpm lint"
pnpm lint

echo "==> pnpm typecheck"
pnpm typecheck

echo "Smoke gate passed."
