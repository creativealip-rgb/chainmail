# Multi-stage build for Chainmail API (Hono + Drizzle + Postgres)
# Stage 1: install all deps, compile TS → dist/
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

# Manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json ./
COPY services/api/package.json ./services/api/
COPY services/parsers/package.json ./services/parsers/
COPY services/parsers/tsconfig.json ./services/parsers/

# Install all deps (build needs devDeps for tsc + tsx for migrate)
RUN pnpm install --filter api... --frozen-lockfile=false

# Source
COPY services/api/ ./services/api/
COPY services/parsers/ ./services/parsers/

# Compile parsers first (api depends on it)
RUN pnpm --filter parsers build
# Compile API
RUN pnpm --filter api build

# Stage 2: runtime — copy node_modules + dist from builder (deterministic, no re-install)
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy compiled output + drizzle migration SQL
COPY --from=builder /app/services/api/dist/ ./dist/
COPY --from=builder /app/services/api/drizzle/ ./dist/drizzle/
# Parsers package: package.json (with main/exports) + dist/ (compiled JS + .d.ts)
COPY --from=builder /app/services/parsers/package.json ./node_modules/parsers/package.json
COPY --from=builder /app/services/parsers/dist/ ./node_modules/parsers/dist/

# Copy workspace root node_modules (real packages live in .pnpm/)
COPY --from=builder /app/node_modules/ ./node_modules/
# Copy API package symlinks (pnpm default: drizzle-orm etc. live here, not in root)
COPY --from=builder /app/services/api/node_modules/ ./services/api/node_modules/

# Re-symlink api's direct deps into root node_modules with absolute paths.
# pnpm generates relative symlinks (../../../node_modules/.pnpm/...) that break
# after COPY because the path context changes. Point them at the real .pnpm dirs.
# Includes scoped packages (@hono/node-server etc).
RUN for link in services/api/node_modules/* services/api/node_modules/@*/*; do \
      [ -L "$link" ] || continue; \
      target=$(readlink "$link"); \
      # resolve to absolute path inside the container
      abs=$(cd "$(dirname "$link")" && cd "$(dirname "$target")" && pwd)/$(basename "$target"); \
      # if the resolved absolute path doesn't exist, fall back to the .pnpm name
      [ -e "$abs" ] || abs="/app/node_modules/.pnpm/$(basename "$target")"; \
      mkdir -p "node_modules/$(dirname "$link" | sed 's|services/api/node_modules||')" && \
      ln -sfn "$abs" "node_modules/$(echo "$link" | sed 's|services/api/node_modules/||')"; \
    done && \
    # remove the relative-pnpm symlinks (replaced by absolute ones above)
    rm -rf services/api/node_modules

EXPOSE 3000

# Run compiled migrations then start API
# cd into dist/ so the migrator's relative "./drizzle" path resolves to dist/drizzle/
CMD ["sh", "-c", "cd /app/dist && node db/migrate.js && cd /app && node dist/index.js"]
