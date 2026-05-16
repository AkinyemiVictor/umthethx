# umthethx

Umthethx is a monorepo for the public web app and in-process conversion queues.

## Active deployment model

The repo is now aligned to Railway-first deployment:

- `apps/web`: Railway web service for the frontend and API routes
- `p-queue`: in-process conversion queues for heavy, light, and cleanup work
- AWS S3: uploads, outputs, and job record storage

Important: as of March 24, 2026, the active runtime does not consume `DATABASE_URL`. The converter and AI NoteMaker flows run without a relational database in the deployed path. If you want Railway Postgres to become part of runtime state, that requires application code, not only deployment config.

## Service config files

- Web service config: `apps/web/railway.json`
- Web image: `apps/web/Dockerfile`

## Local development

1. Copy `.env.example` to `.env` and fill the required values.
2. Install dependencies:

```bash
pnpm install
```

3. Start the web app:

```bash
pnpm -C apps/web dev
```

## Environment variables

Required on Railway web:

- `AWS_REGION`
- `S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Web-only:

- `OPENAI_API_KEY` for AI NoteMaker
- `OPENAI_MODEL` optional override
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` optional analytics
- `NEXT_PUBLIC_ADSENSE_ENABLED` default `true`
- `NEXT_PUBLIC_ADSENSE_CLIENT` AdSense publisher ID. The web app currently defaults to `ca-pub-1041444647484987`.
- `CONVERTER_USAGE_LIMIT` default `12` converter jobs per device per window
- `CONVERTER_IP_USAGE_LIMIT` default `40` converter jobs per IP per window
- `CONVERTER_USAGE_WINDOW_SECONDS` default `14400` (4 hours)
- `CONVERTER_USAGE_BYTES_LIMIT` default `104857600` (100 MB) per device per window
- `CONVERTER_IP_USAGE_BYTES_LIMIT` default `262144000` (250 MB) per IP per window
- `CONVERTER_USAGE_BYTES_WINDOW_SECONDS` default `14400` (4 hours)
- `AI_NOTEMAKER_USAGE_LIMIT` default `60` NoteMaker requests per device per window
- `AI_NOTEMAKER_IP_USAGE_LIMIT` default `120` NoteMaker requests per IP per window
- `AI_NOTEMAKER_USAGE_WINDOW_SECONDS` default `86400` (24 hours)
- `AI_NOTEMAKER_MAX_FILE_BYTES` default `10485760` (10 MB) per uploaded file
- `AI_NOTEMAKER_MAX_TOTAL_UPLOAD_BYTES` default `20971520` (20 MB) across uploaded files in one NoteMaker request
- `AI_NOTEMAKER_MAX_MULTIPART_BYTES` default `22020096` (~21 MB) request-size guard before multipart parsing
- `AI_NOTEMAKER_MAX_COMBINED_CHARS` default `300000` extracted/input characters per NoteMaker request

Converter queue optional overrides:

- `MAX_DOCUMENT_PAGES`
- `HEAVY_WORKER_CONCURRENCY` default `1` for OCR, PDF, and office-heavy jobs
- `HEAVY_WORKER_INPUT_CONCURRENCY` default `1` on Railway and `2` locally
- `LIGHT_WORKER_CONCURRENCY` default `4` for simple image/data conversions
- `LIGHT_WORKER_INPUT_CONCURRENCY` default `1` file at a time inside one light job
- `CLEANUP_WORKER_CONCURRENCY` default `2`
- `WORKER_CONCURRENCY` legacy fallback for heavy jobs if you already use it
- `WORKER_INPUT_CONCURRENCY` legacy fallback for heavy-job file parallelism if you already use it
- `JOB_RETENTION_MS` default `900000` (15 minutes) for temp uploads and outputs after a job finishes
- `WORKER_INSTANCE_LABEL` optional explicit log label

Local-only binary overrides:

- `PYTHON_BIN`
- `TESSERACT_BIN`
- `IMAGEMAGICK_BIN`
- `LIBREOFFICE_BIN`

## Railway deployment

1. Push the repo to GitHub.
2. Create a Railway project from the repo.
3. Create the web service with:
   - Root Directory: `/`
   - Config as Code path: `/apps/web/railway.json`
4. Set required envs:
   - `AWS_REGION`
   - `S3_BUCKET`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
5. Set web-only envs:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` if you want to override the default
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID` if analytics is enabled
   - `NEXT_PUBLIC_ADSENSE_ENABLED`
   - `NEXT_PUBLIC_ADSENSE_CLIENT`
   - `CONVERTER_USAGE_LIMIT`
   - `CONVERTER_IP_USAGE_LIMIT`
   - `CONVERTER_USAGE_WINDOW_SECONDS`
   - `CONVERTER_USAGE_BYTES_LIMIT`
   - `CONVERTER_IP_USAGE_BYTES_LIMIT`
   - `CONVERTER_USAGE_BYTES_WINDOW_SECONDS`
   - `AI_NOTEMAKER_USAGE_LIMIT`
   - `AI_NOTEMAKER_IP_USAGE_LIMIT`
   - `AI_NOTEMAKER_USAGE_WINDOW_SECONDS`
6. Set converter queue optional envs if needed:
   - `MAX_DOCUMENT_PAGES`
   - `HEAVY_WORKER_CONCURRENCY`
   - `HEAVY_WORKER_INPUT_CONCURRENCY`
   - `LIGHT_WORKER_CONCURRENCY`
   - `LIGHT_WORKER_INPUT_CONCURRENCY`
   - `CLEANUP_WORKER_CONCURRENCY`
   - `JOB_RETENTION_MS`
   - `WORKER_INSTANCE_LABEL`
7. Deploy the web service.

Important:

- Converter jobs run in the web process with `p-queue`. Keep the web service on a persistent runtime while jobs are processing.
- Converter and NoteMaker APIs enforce in-memory per-device quotas with an IP fallback. The browser sends a local device ID with requests, and the server applies a cooldown when the limit is exceeded.
- Converter pages now expose a small client-side usage monitor so people can see how many conversions remain in the current 4-hour window and when the allowance resets.
- Converter requests now also enforce a rolling file-size budget. By default, one device can process up to 100 MB of converter uploads in 4 hours before it must wait for the cooldown to expire.
- Conversion traffic is split into three local queues: heavy conversions, light conversions, and cleanup.
- Heavy jobs include OCR, PDF, and office/document renders. Light jobs include simple image/data conversions such as format swaps and CSV to JSON.
- Keep `HEAVY_WORKER_INPUT_CONCURRENCY` low, usually `1` on Railway and rarely above `2`, because OCR and PDF jobs are CPU-heavy.
- Increase `LIGHT_WORKER_CONCURRENCY` before you increase heavy concurrency if the goal is to speed up simple image-format converters.
- Temporary uploaded files and generated outputs are now scheduled for cleanup after the retention window, and completed or failed jobs also request cleanup when the user leaves the page.

## Deployment verification

After deploy:

- Check the web health endpoint at `/api/health`
- Upload a small file and confirm the job moves from `queued` to `processing` to `completed`

## Operational notes

- The web image includes LibreOffice, Poppler, Tesseract, ImageMagick, zbar, qrencode, and Python helpers.
- Railway does not need the local binary override env vars because the web image provides those tools.
- `p-queue` is the in-process queue backend. S3 stores uploads, generated outputs, and the JSON job records used by the active runtime.
