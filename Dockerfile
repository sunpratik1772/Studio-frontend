# syntax=docker/dockerfile:1.7

# ─── Build stage ────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# VITE_API_BASE_URL is baked in at build time (e.g. your Cloud Run backend URL).
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY tsconfig.json vite.config.ts index.html components.json ./
COPY public ./public
COPY src ./src
RUN npm run build

# ─── Runtime stage: nginx ───────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/templates/default.conf.template

# Cloud Run sets $PORT (default 8080); the template substitutes it.
ENV PORT=8080
EXPOSE 8080

COPY --from=build /app/dist /usr/share/nginx/html
