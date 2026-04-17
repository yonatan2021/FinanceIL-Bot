FROM ghcr.io/puppeteer/puppeteer:24.41.0

WORKDIR /app

# Switch to root to install deps and copy files
USER root

COPY package*.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/scraper/package.json ./apps/scraper/

RUN npm ci

COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/scraper/ ./apps/scraper/

# Build shared TypeScript packages in dependency order
RUN npx tsc --build packages/types/tsconfig.json
RUN npx tsc --build packages/utils/tsconfig.json
RUN npx tsc --build packages/db/tsconfig.json

RUN chown -R pptruser /app

# Switch back to pptruser (non-root, required for Puppeteer sandbox)
USER pptruser

CMD ["npm", "run", "start", "--workspace=apps/scraper"]
