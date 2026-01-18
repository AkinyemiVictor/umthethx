# Smoke Test (manual)

Prereqs:
- Redis running and `REDIS_URL` set (local or remote).
- AWS credentials + S3 bucket set in `.env` or `.env.local`.
- `pnpm install` completed.

1) Start the web app:
   - PowerShell: `$env:NEXT_DISABLE_TURBOPACK="1"; pnpm --filter web dev`

2) Start the worker in a second terminal:
   - `pnpm --filter web run worker:convert`

3) Upload JPG -> PDF:
   - Open `http://localhost:3000/`.
   - Select the JPG to PDF converter.
   - Upload a PNG or JPG file.
   - Click Convert and download the PDF.
   - Confirm the worker logs show the job processing and completion.

4) Upload PDF -> image ZIP:
   - Open `http://localhost:3000/convert/pdf-to-jpg`.
   - Upload a PDF file.
   - Click Convert and download the ZIP.
   - Confirm the worker logs show the job processing and completion.

5) Upload Image -> Text:
   - Open `http://localhost:3000/convert/image-to-text`.
   - Upload a JPG or PNG file.
   - Click Convert and download the TXT output.
