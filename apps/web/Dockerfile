# syntax=docker/dockerfile:1
#
# Production image for the web app (next build + next start).
# NEXT_PUBLIC_* values are inlined into the client bundle at build time, and
# next.config.ts reads BACKEND_URL while building the /hubs rewrite, so all of
# them are build arguments. Server-only secrets (AUTH_SECRET,
# KEYCLOAK_CLIENT_SECRET) are passed at runtime instead.

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
# Fewer parallel sockets plus retries: a cold install opens ~1000 downloads and
# a single reset connection otherwise fails the whole build.
RUN npm ci --no-audit --no-fund --maxsockets=8 \
      --fetch-retries=5 --fetch-retry-mintimeout=10000 --fetch-retry-maxtimeout=60000

COPY . .

ARG NEXT_PUBLIC_KEYCLOAK_URL
ARG NEXT_PUBLIC_KEYCLOAK_REALM=chimera
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=chimera-web
ARG NEXT_PUBLIC_STORAGE_URL
ARG BACKEND_URL=http://api:5001
ENV NEXT_PUBLIC_KEYCLOAK_URL=$NEXT_PUBLIC_KEYCLOAK_URL \
    NEXT_PUBLIC_KEYCLOAK_REALM=$NEXT_PUBLIC_KEYCLOAK_REALM \
    NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=$NEXT_PUBLIC_KEYCLOAK_CLIENT_ID \
    NEXT_PUBLIC_STORAGE_URL=$NEXT_PUBLIC_STORAGE_URL \
    BACKEND_URL=$BACKEND_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

COPY --from=build --chown=node:node /app ./
USER node

EXPOSE 3000
CMD ["npx", "next", "start", "--port", "3000"]
