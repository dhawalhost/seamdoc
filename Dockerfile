# ─────────────────────────────────────────────
# Stage 1: builder — install deps + compile all packages
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm matching the repository's version
RUN npm install -g pnpm@9.15.9

# Copy workspace manifests first (layer-cache friendly)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/packages-tsconfig.json ./packages/

# Copy all packages and apps source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build all workspace packages + the API app
RUN pnpm --filter "@seamdoc/*" build
RUN pnpm --filter "@seamdoc/api" build

# ─────────────────────────────────────────────
# Stage 2: cli — minimal image for the CLI tool
# ─────────────────────────────────────────────
FROM node:22-alpine AS cli

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Default ENTRYPOINT compiles a document via CLI
ENTRYPOINT ["node", "/app/packages/cli/dist/bin/seamdoc.js", "compile"]

# ─────────────────────────────────────────────
# Stage 3: api — production image for the REST API
# ─────────────────────────────────────────────
FROM node:22-alpine AS api

WORKDIR /app

# Only copy what the API server needs at runtime
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Runtime environment defaults (overrideable via docker run -e or compose env_file)
ENV PORT=3001
ENV NODE_ENV=production

EXPOSE ${PORT}

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/v1/health || exit 1

ENTRYPOINT ["node", "apps/api/dist/index.js"]
