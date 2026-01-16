import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

type EnvKey =
  | "AWS_REGION"
  | "AWS_ACCESS_KEY_ID"
  | "AWS_SECRET_ACCESS_KEY"
  | "S3_BUCKET";

const requireEnv = (key: EnvKey) => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
};

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
    region: requireEnv("AWS_REGION"),
    credentials: {
      accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });

export const getS3Bucket = () => requireEnv("S3_BUCKET");

export const createUploadKey = (userId: string, fileName: string) => {
  const safeName = sanitizeFileName(fileName);
  return `u/${userId}/uploads/${randomUUID()}/${safeName}`;
};

export const createPresignedUploadUrl = async (options: {
  key: string;
  mime: string;
  expiresIn?: number;
}) => {
  const expiresIn = options.expiresIn ?? 300;
  const command = new PutObjectCommand({
    Bucket: getS3Bucket(),
    Key: options.key,
    ContentType: options.mime,
  });
  const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn });
  return { uploadUrl, expiresIn };
};

export const createPresignedDownloadUrl = async (options: {
  key: string;
  bucket?: string;
  expiresIn?: number;
}) => {
  const expiresIn = options.expiresIn ?? 300;
  const command = new GetObjectCommand({
    Bucket: options.bucket ?? getS3Bucket(),
    Key: options.key,
  });
  const downloadUrl = await getSignedUrl(getS3Client(), command, { expiresIn });
  return { downloadUrl, expiresIn };
};

export const deleteS3Object = async (options: {
  key: string;
  bucket?: string;
}) => {
  const command = new DeleteObjectCommand({
    Bucket: options.bucket ?? getS3Bucket(),
    Key: options.key,
  });
  await getS3Client().send(command);
};
