# Smoke Test (manual)

Prereqs:

- AWS credentials + S3 bucket set in `.env` or `.env.local`.
- `pnpm install` completed.

1. Start the web app:
   - PowerShell: `$env:NEXT_DISABLE_TURBOPACK="1"; pnpm --filter web dev`

2. Upload JPG -> PDF:
   - Open `http://localhost:3000/`.
   - Select the JPG to PDF converter.
   - Upload a PNG or JPG file.
   - Click Convert and download the PDF.
   - Confirm the job moves from queued to processing to completed.

3. Upload PDF -> image ZIP:
   - Open `http://localhost:3000/convert/pdf-to-jpg`.
   - Upload a PDF file.
   - Click Convert and download the ZIP.
   - Confirm the job moves from queued to processing to completed.

4. Upload Image -> Text:
   - Open `http://localhost:3000/convert/image-to-text`.
   - Upload a JPG or PNG file.
   - Click Convert and download the TXT output.
