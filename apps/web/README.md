# Web App

This package contains the Umthethx frontend and API routes.

## Railway

- Config as code: `apps/web/railway.json`
- Production start script: `apps/web/scripts/start-web.mjs`

## Local commands

```bash
pnpm -C apps/web dev
pnpm -C apps/web build
pnpm -C apps/web start
pnpm -C apps/web run worker:convert
```

See the repository root `README.md` for the active Railway deployment model, shared environment variables, and deployment steps.
