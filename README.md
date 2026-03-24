# umthethx

Umthethx is a monorepo for the public web app and the background conversion worker.

## Active deployment model

The repo is now aligned to Railway-first deployment:

- `apps/web`: Railway web service for the frontend and API routes
- `workers/convert/railway.json`: Railway worker service for BullMQ conversions
- Railway Redis: shared queue backend via `REDIS_URL`
- AWS S3: uploads, outputs, and job record storage

Important: as of March 24, 2026, the active runtime does not consume `DATABASE_URL`. The converter and AI NoteMaker flows run without a relational database in the deployed path. If you want Railway Postgres to become part of runtime state, that requires application code, not only deployment config.

## Service config files

- Web service config: `apps/web/railway.json`
- Worker service config: `workers/convert/railway.json`
- Worker image: `Dockerfile`

## Local development

1. Copy `.env.example` to `.env` and fill the required values.
2. Start Redis locally:

```bash
docker run -d --name umthethx-redis -p 6379:6379 redis:7-alpine
```

3. Install dependencies:

```bash
pnpm install
```

4. Start the web app:

```bash
pnpm -C apps/web dev
```

5. Start the worker in another terminal:

```bash
pnpm worker:convert
```

6. Optional for image translation during local development:

```bash
docker run -p 5000:5000 libretranslate/libretranslate
```

## Environment variables

Required on both Railway web and Railway worker:

- `REDIS_URL`
- `AWS_REGION`
- `S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Web-only:

- `OPENAI_API_KEY` for AI NoteMaker
- `OPENAI_MODEL` optional override
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` optional analytics

Worker-only optional overrides:

- `MAX_DOCUMENT_PAGES`
- `LIBRETRANSLATE_URL`
- `LIBRETRANSLATE_API_KEY`
- `LIBRETRANSLATE_TARGET_LANG`
- `LIBRETRANSLATE_SOURCE_LANG`

Local-only binary overrides:

- `PYTHON_BIN`
- `TESSERACT_BIN`
- `IMAGEMAGICK_BIN`
- `LIBREOFFICE_BIN`

## Railway deployment

1. Push the repo to GitHub.
2. Create a Railway project from the repo.
3. Add a Redis service in Railway.
4. Create the web service with:
   - Root Directory: `/`
   - Config as Code path: `apps/web/railway.json`
5. Create the worker service with:
   - Root Directory: `/`
   - Config as Code path: `workers/convert/railway.json`
6. Set shared envs on both services:
   - `REDIS_URL=${{Redis.REDIS_URL}}`
   - `AWS_REGION`
   - `S3_BUCKET`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
7. Set web-only envs:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` if you want to override the default
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID` if analytics is enabled
8. Set worker-only optional envs if needed:
   - `MAX_DOCUMENT_PAGES`
   - `LIBRETRANSLATE_URL`
   - `LIBRETRANSLATE_API_KEY`
   - `LIBRETRANSLATE_TARGET_LANG`
   - `LIBRETRANSLATE_SOURCE_LANG`
9. Deploy both services.

## Deployment verification

After deploy:

- Check the web health endpoint at `/api/health`
- Confirm the worker logs show it is listening for `converter-jobs`
- Upload a small file and confirm the job moves from `queued` to `processing` to `completed`

## Operational notes

- The worker image already includes LibreOffice, Poppler, Tesseract, ImageMagick, zbar, qrencode, and Python helpers.
- Railway does not need the local binary override env vars because the worker image provides those tools.
- Redis is the queue backend. S3 stores uploads, generated outputs, and the JSON job records used by the active runtime.
