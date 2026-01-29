import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
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

let cachedClient: S3Client | null = null;

export const getS3Client = () => {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: requireEnv("AWS_REGION"),
      credentials: {
        accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }
  return cachedClient;
};

export const getS3Bucket = () => requireEnv("S3_BUCKET");

export const buildUploadKey = (jobId: string, fileName: string) => {
  const safeName = sanitizeFileName(fileName);
  return `temp/${jobId}/uploads/${randomUUID()}/${safeName}`;
};

export const buildArtifactKey = (jobId: string, fileName: string) => {
  const safeName = sanitizeFileName(fileName);
  return `temp/${jobId}/artifacts/${safeName}`;
};

export const signPutObject = async (options: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}) => {
  const expiresIn = options.expiresInSeconds ?? 300;
  const command = new PutObjectCommand({
    Bucket: getS3Bucket(),
    Key: options.key,
    ContentType: options.contentType,
  });
  const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn });
  return { uploadUrl, expiresIn };
};

export const signGetObject = async (options: {
  key: string;
  expiresInSeconds?: number;
  filename?: string;
  contentType?: string;
}) => {
  const expiresIn = options.expiresInSeconds ?? 300;
  const safeName = options.filename ? sanitizeFileName(options.filename) : null;
  const command = new GetObjectCommand({
    Bucket: getS3Bucket(),
    Key: options.key,
    ...(safeName
      ? { ResponseContentDisposition: `attachment; filename="${safeName}"` }
      : {}),
    ...(options.contentType ? { ResponseContentType: options.contentType } : {}),
  });
  const downloadUrl = await getSignedUrl(getS3Client(), command, { expiresIn });
  return { downloadUrl, expiresIn };
};

export const deleteS3Prefix = async (options: { prefix: string }) => {
  const client = getS3Client();
  const bucket = getS3Bucket();
  let token: string | undefined;

  do {
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: options.prefix,
        ContinuationToken: token,
      }),
    );
    const keys = (list.Contents ?? [])
      .map((item) => item.Key)
      .filter((key): key is string => Boolean(key));

    if (keys.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys.map((key) => ({ Key: key })) },
        }),
      );
    }

    token = list.NextContinuationToken;
  } while (token);
};
