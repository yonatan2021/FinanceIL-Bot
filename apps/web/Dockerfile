FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++

# Install root deps
COPY package.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/web/package.json ./apps/web/

RUN npm install --workspaces --include-workspace-root

# Copy all source
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Build packages (types → utils → db)
RUN npx tsc --build packages/types/tsconfig.json
RUN npx tsc --build packages/utils/tsconfig.json
RUN npx tsc --build packages/db/tsconfig.json

# Init shadcn and add components
WORKDIR /app/apps/web
RUN npx shadcn@latest init --yes --defaults 2>/dev/null || true
RUN npx shadcn@latest add button input label card table badge dialog form select separator skeleton --yes 2>/dev/null || true

# Ensure public dir exists
RUN mkdir -p /app/apps/web/public

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=/tmp/data.db
ENV AUTH_DB_URL=/tmp/auth.db
ENV AUTH_SECRET=build-time-placeholder-not-real
ENV DASHBOARD_PASSWORD=build-time-placeholder
ENV ENCRYPTION_KEY=00000000000000000000000000000000

# Pre-create DB files so better-sqlite3 can open them at module eval during build
RUN touch /tmp/data.db /tmp/auth.db

WORKDIR /app/apps/web
RUN npm run build

# --- Production image ---
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/apps/web/package.json ./apps/web/package.json
COPY --from=base /app/package.json ./package.json

USER nextjs

EXPOSE 5200
ENV PORT=5200
ENV HOSTNAME="0.0.0.0"

WORKDIR /app/apps/web
CMD ["node_modules/.bin/next", "start"]
