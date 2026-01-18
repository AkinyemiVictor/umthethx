# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS build
RUN corepack enable
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM node:20-bookworm-slim AS runtime
RUN corepack enable
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  fontconfig \
  fonts-dejavu-core \
  imagemagick \
  libheif1 \
  librsvg2-bin \
  libreoffice \
  poppler-utils \
  qrencode \
  tesseract-ocr \
  zbar-tools \
  zip \
  python3 \
  python3-pip \
  && rm -rf /var/lib/apt/lists/*
RUN pip3 install --no-cache-dir pdfplumber pandas openpyxl img2pdf

WORKDIR /app
COPY --from=build /app /app

CMD ["pnpm", "-C", "apps/web", "run", "worker:convert"]
