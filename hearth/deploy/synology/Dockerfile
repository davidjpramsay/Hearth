# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24.18.0-bookworm-slim
ARG NGINX_IMAGE=nginx:1.30.4-alpine3.24

FROM ${NODE_IMAGE} AS workspace
WORKDIR /workspace
RUN apt-get update \
  && apt-get install --yes --no-install-recommends g++ make python3 \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY patches patches
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile
COPY apps/server apps/server
COPY apps/web apps/web
COPY packages/core packages/core
COPY packages/shared packages/shared
COPY integrations integrations
COPY scripts scripts
COPY deploy/portable deploy/portable
RUN pnpm build:packages

FROM workspace AS server-build
RUN pnpm --filter @hearth/server build \
  && pnpm --filter @hearth/server deploy --prod --legacy /opt/hearth-server \
  && cd /opt/hearth-server/node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 \
  && rm -f prebuilds/linux-*.node prebuilds/linuxmusl-*.node \
  && npm run build-release

FROM workspace AS web-build
RUN pnpm --filter @hearth/web build

FROM ${NODE_IMAGE} AS server
ENV NODE_ENV=production \
  HEARTH_HOST=0.0.0.0 \
  HEARTH_PORT=4310
WORKDIR /app
COPY --from=server-build --chown=node:node /opt/hearth-server/ ./
USER node
EXPOSE 4310
CMD ["node", "dist/index.js"]

FROM ${NGINX_IMAGE} AS web
COPY deploy/synology/nginx.conf /etc/nginx/nginx.conf
COPY --from=web-build /workspace/apps/web/dist/ /usr/share/nginx/html/
USER 101:101
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
