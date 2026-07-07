# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm matching the repository's version
RUN npm install -g pnpm@9.15.9

# Copy project configuration files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.json ./
COPY packages/packages-tsconfig.json ./packages/

# Copy all packages
COPY packages/ ./packages/

# Copy web app config for workspace resolution (but exclude its src/assets to keep build light)
COPY apps/web/package.json apps/web/tsconfig.json ./apps/web/

# Install dependencies and build libraries
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "@seamdoc/*" build

# Production Stage
FROM node:22-alpine

WORKDIR /app

# Copy built workspace structures and node_modules from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Set default ENTRYPOINT to execute seamdoc compile command
ENTRYPOINT ["node", "/app/packages/cli/dist/bin/seamdoc.js", "compile"]
