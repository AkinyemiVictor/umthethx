import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { createUploadKey, getS3BucketName, getS3Client } from "../../../lib/s3";

export const runtime = "nodejs";

type PresignRequest = {
  fileName?: string;
  contentType?: string;
};

export async function POST(request: Request) {
  let body: PresignRequest;
  try {
    body = (await request.json()) as PresignRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const fileName = body.fileName?.trim();
  if (!fileName) {
    return NextResponse.json(
      { error: "fileName is required." },
      { status: 400 },
    );
  }

  const contentType = body.contentType?.trim() || "application/octet-stream";
  const key = createUploadKey(fileName);

  try {
    const command = new PutObjectCommand({
      Bucket: getS3BucketName(),
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(getS3Client(), command, {
      expiresIn: 300,
    });

    return NextResponse.json({
      url,
      key,
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to presign upload.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
