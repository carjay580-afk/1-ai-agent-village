# ============================================================================
# AI Agent Village — Multi-Stage Production Dockerfile
# Supports both External PostgreSQL (DATABASE_URL) & Persistent Volume (/data)
# ============================================================================

FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run typecheck && npm run build && npm prune --omit=dev

# ----------------------------------------------------------------------------
# Production Runtime Stage (Minimal Attack Surface · Non-Root User)
# ----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV VILLAGE_REGION=ca-central-1

# Create persistent /data directory owned by non-root node user for PGlite mode
RUN mkdir -p /data && chown -R node:node /data /app

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/config ./config
COPY --from=builder --chown=node:node /app/database ./database
COPY --from=builder --chown=node:node /app/tests/DBT-001 ./tests/DBT-001

USER node

VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server/index.js"]
