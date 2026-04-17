FROM node:24-alpine

WORKDIR /app

RUN addgroup -S botgroup && adduser -S botuser -G botgroup

COPY package*.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/bot/package.json ./apps/bot/

RUN npm ci

COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/bot/ ./apps/bot/

RUN chown -R botuser:botgroup /app

USER botuser

CMD ["npm", "run", "start", "--workspace=@finance-bot/bot"]
