# umthethx

Simple upload -> convert -> download tool. No accounts or history.

## Local dev

1. Copy `.env.example` to `.env` and fill required values.
2. Start Redis: `docker run -d --name umthethx-redis -p 6379:6379 redis:7-alpine`
3. Install deps: `pnpm install`
4. Start web (PowerShell): `$env:NEXT_DISABLE_TURBOPACK="1"; pnpm --filter web dev`
5. Start worker in another terminal: `pnpm --filter web run worker:convert`

## Redis config

BullMQ needs a TCP Redis connection.

- Local Redis: set `REDIS_URL=redis://localhost:6379`
- Managed Redis: set `REDIS_URL`, or set `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD`
- Upstash: use the database host/password values, not only the REST API values
- TLS is enabled automatically for `*.upstash.io`; set `REDIS_TLS=true` if you need TLS for another host
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are supported as a fallback when the TCP host/password vars are not set

## Online deployment (Railway)

This repo includes Railway config-as-code files:

- Web service config: `apps/web/railway.json`
- Worker service config: `workers/convert/railway.json`

1. Push this repo to GitHub.
2. Create a new Railway project from that repo.
3. Provision a Redis instance reachable by both services, either in Railway or externally with Upstash.
4. Create the web service from the repo and set:
   - Root Directory: `/`
   - Config as Code path: `apps/web/railway.json`
5. Create the worker service from the repo and set:
   - Root Directory: `/`
   - Config as Code path: `workers/convert/railway.json`
6. Set Redis envs on both services:
   - Railway Redis: `REDIS_URL=${{Redis.REDIS_URL}}`
   - Upstash: `REDIS_URL` or `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
7. Set required app secrets:
   - Web: `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, plus Redis envs
   - Worker: `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, plus Redis envs
   - Feature-specific extras: `OPENAI_API_KEY` for AI NoteMaker, `LIBRETRANSLATE_*` if image translation should call a remote LibreTranslate service
8. Deploy both services, then:
   - Check web health at `/api/health`
   - Confirm worker logs show it is consuming `converter-jobs`

If you move the worker to Fly.io, reuse the same Redis envs there so the web app and worker are attached to the same BullMQ queue.

## Worker deployment (Fly.io)

This repo now includes a dedicated Fly worker config at `workers/convert/fly.toml`.

1. Install and authenticate Fly CLI.
2. Create the Fly app without deploying yet:
   - `fly launch --no-deploy --copy-config -c workers/convert/fly.toml`
3. Edit `app = "umthethx-worker"` in `workers/convert/fly.toml` if you want a different app name.
4. Keep `primary_region` close to your AWS region, not necessarily your Redis region.
   - For `AWS_REGION=eu-north-1`, this repo uses `primary_region = "arn"` (Stockholm).
5. Set worker secrets on Fly:
   - `fly secrets set REDIS_URL=... AWS_REGION=... S3_BUCKET=... AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... -c workers/convert/fly.toml`
6. Deploy the worker from the repo root:
   - `fly deploy -c workers/convert/fly.toml .`

Notes:
- This worker app intentionally has no `services` or `http_service` section because it only consumes BullMQ jobs.
- The worker command is the same conversion worker already used locally and on Railway.
- Worker concurrency is pinned to `1` in code to avoid overlapping heavy conversions on a small Fly Machine.
- Sensitive values should go into Fly secrets, not the `fly.toml` file.

## Railway + Upstash + Fly checklist

Use this order if the app is being split across Railway web, Upstash Redis, and Fly worker.

1. Upstash Redis
   - Create the Redis database.
   - Copy the TCP connection string, preferably `REDIS_URL=rediss://...`.
   - Put the same Redis env on both Railway web and the Fly worker.

2. AWS S3 bucket
   - Make sure `S3_BUCKET` exists in the same `AWS_REGION` you configure in the app.
   - The IAM credentials used by the app need at least `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, and `s3:ListBucket`.
   - For OCR and PDF text extraction, those AWS credentials also need Textract permissions.

3. S3 bucket CORS
   - This app uploads directly from the browser to S3 using a signed `PUT` URL.
   - If CORS is missing or the allowed origin is wrong, the UI will appear stuck at `Uploading...` before Redis or Fly is involved.
   - Add bucket CORS for your production and local origins. Example:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "https://www.umthethx.online",
      "https://umthethx.online",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

4. Railway web envs
   - Required for the converter flow: `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `REDIS_URL`
   - Optional or feature-specific: `OPENAI_API_KEY`, `OPENAI_MODEL`, `LIBRETRANSLATE_URL`, `LIBRETRANSLATE_API_KEY`, analytics envs

5. Fly worker envs
   - Required: `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `REDIS_URL`
   - Optional or feature-specific: `LIBRETRANSLATE_URL`, `LIBRETRANSLATE_API_KEY`, `MAX_DOCUMENT_PAGES`

6. Deploy order
   - Deploy Railway web first and confirm `https://www.umthethx.online/api/health` returns `ok`
   - Log in to Fly, create the Fly app, set Fly secrets, then deploy the Fly worker
   - Then test one small upload

7. What to test in the browser
   - `POST /api/uploads/sign` should return `200`
   - The signed S3 `PUT` request should return `200`
   - `POST /api/jobs` should return `200`
   - After that, `/api/jobs/{jobId}` should move from `queued` to `processing` to `completed`

## If upload is stuck at `Uploading...`

That symptom is almost always before BullMQ and before the Fly worker.

- The client first calls `/api/uploads/sign`
- Then the browser uploads the file directly to S3 with a signed `PUT`
- Only after that succeeds does the app call `/api/jobs` and enqueue BullMQ work

So if the UI hangs at `Uploading...`, check these first:

1. Railway web has valid `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
2. The bucket region matches `AWS_REGION`
3. The bucket CORS includes `https://www.umthethx.online`
4. The signed `PUT` request is not getting a `403`, `307`, or CORS failure in the browser Network tab
5. The IAM user behind the AWS credentials can `PutObject` into the bucket

## What is still manual

The repo changes alone are not enough to create a worker in Fly.io.

- If you have not run `fly auth login`, you are not authenticated with Fly yet.
- If you have not run `fly launch --no-deploy --copy-config -c workers/convert/fly.toml`, the Fly app does not exist yet.
- If you have not run `fly secrets set ...`, the worker has no runtime credentials.
- If you have not run `fly deploy -c workers/convert/fly.toml .`, there is still no worker Machine processing BullMQ jobs.

## Worker container

Builds include LibreOffice, Poppler, Tesseract, ImageMagick, zbar/qrencode, and Python helpers.

```
docker build -t umthethx-worker .
docker run --env-file .env umthethx-worker
```

## LibreTranslate

Image translation uses LibreTranslate (defaults to `http://localhost:5000`).

```
docker run -p 5000:5000 libretranslate/libretranslate
```

## Output behavior

- Multi-page outputs (PDF -> JPG, Word/Excel -> JPG) are zipped.
- PDF -> HTML returns a zip with HTML + assets.

---

The notes below are from the original Turborepo starter template.

This Turborepo starter is maintained by the Turborepo core team.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
