import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { converters } from "../../../../src/lib/converters";
import {
  createPresignedUploadUrl,
  createUploadKey,
  getS3Bucket,
} from "../../../../src/lib/s3";
import { env } from "../../../lib/env";
import { getSupabaseAdminClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";

type SignRequest = {
  filename?: string;
  mime?: string;
  sizeBytes?: number;
};

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

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
  const userId = env.get("PUBLIC_USER_ID");

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
  const mime = body.mime?.trim();
  const sizeBytes = Number(body.sizeBytes);

  if (!filename || !mime || !Number.isFinite(sizeBytes)) {
    return NextResponse.json(
      { error: "filename, mime, and sizeBytes are required." },
      { status: 400 },
    );
  }

  if (sizeBytes <= 0) {
    return NextResponse.json(
      { error: "sizeBytes must be greater than 0." },
      { status: 400 },
    );
  }

  if (!isMimeAllowed(mime)) {
    return NextResponse.json(
      { error: "File type is not supported." },
      { status: 415 },
    );
  }

  if (sizeBytes > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "File exceeds the upload size limit." },
      { status: 413 },
    );
  }

  const key = createUploadKey(userId, filename);
  const { uploadUrl, expiresIn } = await createPresignedUploadUrl({
    key,
    mime,
  });
  const bucket = getS3Bucket();
  const fileId = randomUUID();

  const supabase = getSupabaseAdminClient();
  const { error: insertError } = await supabase.from("files").insert({
    id: fileId,
    user_id: userId,
    job_id: null,
    kind: "upload",
    bucket,
    key,
    original_name: filename,
    size_bytes: Math.trunc(sizeBytes),
    mime,
    retained: false,
  });

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    uploadUrl,
    key,
    bucket,
    expiresIn,
    fileId,
  });
}
