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
- Web image: `apps/web/Dockerfile`
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
- `CONVERTER_USAGE_LIMIT` default `12` converter jobs per device per window
- `CONVERTER_IP_USAGE_LIMIT` default `40` converter jobs per IP per window
- `CONVERTER_USAGE_WINDOW_SECONDS` default `14400` (4 hours)
- `CONVERTER_USAGE_BYTES_LIMIT` default `104857600` (100 MB) per device per window
- `CONVERTER_IP_USAGE_BYTES_LIMIT` default `262144000` (250 MB) per IP per window
- `CONVERTER_USAGE_BYTES_WINDOW_SECONDS` default `14400` (4 hours)
- `AI_NOTEMAKER_USAGE_LIMIT` default `60` NoteMaker requests per device per window
- `AI_NOTEMAKER_IP_USAGE_LIMIT` default `120` NoteMaker requests per IP per window
- `AI_NOTEMAKER_USAGE_WINDOW_SECONDS` default `86400` (24 hours)

Worker-only optional overrides:

- `MAX_DOCUMENT_PAGES`
- `HEAVY_WORKER_CONCURRENCY` default `1` for OCR, PDF, and office-heavy jobs
- `HEAVY_WORKER_INPUT_CONCURRENCY` default `2` files processed in parallel inside one heavy job
- `LIGHT_WORKER_CONCURRENCY` default `4` for simple image/data conversions
- `LIGHT_WORKER_INPUT_CONCURRENCY` default `1` file at a time inside one light job
- `CLEANUP_WORKER_CONCURRENCY` default `2`
- `WORKER_CONCURRENCY` legacy fallback for heavy jobs if you already use it
- `WORKER_INPUT_CONCURRENCY` legacy fallback for heavy-job file parallelism if you already use it
- `JOB_RETENTION_MS` default `900000` (15 minutes) for temp uploads and outputs after a job finishes
- `WORKER_MAX_JOBS` default `25` on Railway before a worker exits and restarts
- `WORKER_INSTANCE_LABEL` optional explicit log label
- `WORKER_KEEPALIVE_MS`

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
   - Config as Code path: `/apps/web/railway.json`
5. Create the worker service with:
   - Root Directory: `/`
   - Config as Code path: `/workers/convert/railway.json`
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
   - `CONVERTER_USAGE_LIMIT`
   - `CONVERTER_IP_USAGE_LIMIT`
   - `CONVERTER_USAGE_WINDOW_SECONDS`
   - `CONVERTER_USAGE_BYTES_LIMIT`
   - `CONVERTER_IP_USAGE_BYTES_LIMIT`
   - `CONVERTER_USAGE_BYTES_WINDOW_SECONDS`
   - `AI_NOTEMAKER_USAGE_LIMIT`
   - `AI_NOTEMAKER_IP_USAGE_LIMIT`
   - `AI_NOTEMAKER_USAGE_WINDOW_SECONDS`
8. Set worker-only optional envs if needed:
   - `MAX_DOCUMENT_PAGES`
   - `HEAVY_WORKER_CONCURRENCY`
   - `HEAVY_WORKER_INPUT_CONCURRENCY`
   - `LIGHT_WORKER_CONCURRENCY`
   - `LIGHT_WORKER_INPUT_CONCURRENCY`
   - `CLEANUP_WORKER_CONCURRENCY`
   - `JOB_RETENTION_MS`
   - `WORKER_MAX_JOBS`
   - `WORKER_INSTANCE_LABEL`
   - `WORKER_KEEPALIVE_MS`
9. Deploy both services.

Important:

- The BullMQ worker must stay awake as a persistent Railway service.
- Disable Railway Serverless / App Sleeping for the worker service. Redis jobs do not count as inbound traffic that can wake a sleeping worker.
- The worker now sends a Redis keepalive ping every 60 seconds by default so Railway sees regular outbound traffic after startup.
- Converter and NoteMaker APIs now enforce Redis-backed per-device quotas with an IP fallback. The browser sends a local device ID with requests, and the server applies a cooldown when the limit is exceeded.
- Converter pages now expose a small client-side usage monitor so people can see how many conversions remain in the current 4-hour window and when the allowance resets.
- Converter requests now also enforce a rolling file-size budget. By default, one device can process up to 100 MB of converter uploads in 4 hours before it must wait for the cooldown to expire.
- Conversion traffic is split into three BullMQ queues: heavy conversions, light conversions, and cleanup.
- Heavy jobs include OCR, PDF, and office/document renders. Light jobs include simple image/data conversions such as format swaps and CSV to JSON.
- Multiple Railway worker replicas are supported. With two replicas and `HEAVY_WORKER_CONCURRENCY=1`, the heavy queue can process two heavy jobs in parallel while light jobs continue independently.
- Keep `HEAVY_WORKER_INPUT_CONCURRENCY` low, usually `2`, because OCR and PDF jobs are CPU-heavy.
- Increase `LIGHT_WORKER_CONCURRENCY` before you increase heavy concurrency if the goal is to speed up simple image-format converters.
- Temporary uploaded files and generated outputs are now scheduled for cleanup after the retention window, and completed or failed jobs also request cleanup when the user leaves the page.
- On Railway, each worker replica now defaults to restarting after 25 processed conversion jobs so long-lived memory growth does not accumulate indefinitely.

## Deployment verification

After deploy:

- Check the web health endpoint at `/api/health`
- Confirm the worker logs show it is listening for `converter-jobs-heavy`, `converter-jobs-light`, and `converter-jobs-cleanup`
- Upload a small file and confirm the job moves from `queued` to `processing` to `completed`

## Operational notes

- The worker image already includes LibreOffice, Poppler, Tesseract, ImageMagick, zbar, qrencode, and Python helpers.
- Railway does not need the local binary override env vars because the worker image provides those tools.
- Redis is the queue backend. S3 stores uploads, generated outputs, and the JSON job records used by the active runtime.
