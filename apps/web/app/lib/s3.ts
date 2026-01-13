import "server-only";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { env } from "./env";

const sanitizeFileName = (fileName: string) => {
  const cleaned = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+/, "")
    .trim();
  return cleaned.length > 0 ? cleaned : "file";
};

export const getS3Client = () =>
  new S3Client({
    region: env.get("AWS_REGION"),
    credentials: {
      accessKeyId: env.get("AWS_ACCESS_KEY_ID"),
      secretAccessKey: env.get("AWS_SECRET_ACCESS_KEY"),
    },
  });

export const getS3BucketName = () => env.get("S3_BUCKET");

export const createUploadKey = (fileName: string) => {
  const safeName = sanitizeFileName(fileName);
  const dateStamp = new Date().toISOString().slice(0, 10);
  return `uploads/${dateStamp}/${randomUUID()}-${safeName}`;
};

export const createDownloadUrl = async (
  key: string,
  expiresIn = 300,
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: getS3BucketName(),
    Key: key,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn });
};
