# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV NODE_ENV=development
ENV DATABASE_URL=mysql://localhost:3306/arunika_coffee_master_data

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma.config.js ./
COPY prisma ./prisma
COPY proto ./proto
COPY src ./src

RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma/generated ./prisma/generated
COPY --from=builder /app/proto ./proto
COPY scripts/docker-healthcheck.mjs ./scripts/docker-healthcheck.mjs

USER node

EXPOSE 50053

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "scripts/docker-healthcheck.mjs"]

CMD ["node", "dist/src/main.js"]
