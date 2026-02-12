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
  python3-venv \
  && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/venv \
  && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
  && /opt/venv/bin/pip install --no-cache-dir pdfplumber pandas openpyxl img2pdf
ENV PATH="/opt/venv/bin:${PATH}"
ENV PYTHON_BIN="/opt/venv/bin/python"

WORKDIR /app
COPY --from=build /app /app

CMD ["node", "apps/web/node_modules/tsx/dist/cli.mjs", "apps/web/worker/convert-worker.ts"]
