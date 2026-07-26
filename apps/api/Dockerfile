# Optional alternative to Railway's Nixpacks builder. Multi-stage, non-root.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/tokens/package.json packages/tokens/
COPY apps/api/package.json apps/api/
RUN npm ci --omit=dev --workspace @cwl/api --include-workspace-root

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S cwl && adduser -S cwl -G cwl
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=cwl:cwl packages/tokens packages/tokens
COPY --chown=cwl:cwl apps/api apps/api
COPY --chown=cwl:cwl content content
USER cwl
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:${PORT:-4000}/api/health || exit 1
CMD ["node", "apps/api/src/index.js"]
