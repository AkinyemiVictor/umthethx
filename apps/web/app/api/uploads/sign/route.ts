import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { converters } from "../../../../src/lib/converters";
import { buildUploadKey, signPutObject } from "../../../../src/lib/s3";

export const runtime = "nodejs";

type SignRequest = {
  filename?: string;
  contentType?: string;
  mime?: string;
  sizeBytes?: number;
  jobId?: string;
};

const MAX_FILENAME_LENGTH = 180;
const MAX_BYTES = 200 * 1024 * 1024;

const { allowedMimeTypes, wildcardPrefixes } = converters.reduce(
  (acc, converter) => {
    converter.accept.mimeTypes.forEach((mime) => {
      if (mime.includes("/*")) {
        acc.wildcardPrefixes.add(mime.split("/")[0] + "/");
      } else {
        acc.allowedMimeTypes.add(mime.toLowerCase());
      }
    });
    return acc;
  },
  {
    allowedMimeTypes: new Set<string>(),
    wildcardPrefixes: new Set<string>(),
  },
);

const isMimeAllowed = (mime: string) => {
  const normalized = mime.toLowerCase().split(";")[0]?.trim();
  if (!normalized) return false;
  if (allowedMimeTypes.has(normalized)) return true;
  for (const prefix of wildcardPrefixes) {
    if (normalized.startsWith(prefix)) {
      return true;
    }
  }
  return false;
};

export async function POST(request: Request) {
  try {
    let body: SignRequest;
    try {
      body = (await request.json()) as SignRequest;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 },
      );
    }

    const filename = body.filename?.trim();
    const contentType = body.contentType?.trim() || body.mime?.trim();
    const sizeBytes = Number(body.sizeBytes);
    const jobId = body.jobId?.trim() || randomUUID();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType are required." },
        { status: 400 },
      );
    }

    if (filename.length > MAX_FILENAME_LENGTH) {
      return NextResponse.json(
        { error: "filename is too long." },
        { status: 400 },
      );
    }

    if (/[\\/]/.test(filename)) {
      return NextResponse.json(
        { error: "filename must not include path separators." },
        { status: 400 },
      );
    }

    if (jobId.includes("/") || jobId.includes("..")) {
      return NextResponse.json(
        { error: "jobId is invalid." },
        { status: 400 },
      );
    }

    if (Number.isFinite(sizeBytes) && sizeBytes <= 0) {
      return NextResponse.json(
        { error: "sizeBytes must be greater than 0." },
        { status: 400 },
      );
    }

    if (Number.isFinite(sizeBytes) && sizeBytes > MAX_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the upload size limit." },
        { status: 413 },
      );
    }

    if (!isMimeAllowed(contentType)) {
      return NextResponse.json(
        { error: "File type is not supported." },
        { status: 415 },
      );
    }

    const key = buildUploadKey(jobId, filename);
    const { uploadUrl, expiresIn } = await signPutObject({
      key,
      contentType,
    });

    return NextResponse.json({
      jobId,
      uploadUrl,
      key,
      expiresIn,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create upload URL.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
