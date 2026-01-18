import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { getS3Bucket, getS3Client } from "./s3";

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type JobInput = {
  key: string;
  filename: string;
  contentType: string;
};

export type JobOutput = {
  key: string;
  filename: string;
};

export type JobRecord = {
  id: string;
  status: JobStatus;
  converterSlug: string;
  inputs: JobInput[];
  outputs: JobOutput[];
  expiresAt: string;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};

type JobRecordInput = Omit<JobRecord, "expiresAt" | "createdAt" | "updatedAt" | "outputs"> & {
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  outputs?: JobOutput[];
};

const DEFAULT_JOB_TTL_MS = 24 * 60 * 60 * 1000;

const jobKey = (jobId: string) => `temp/${jobId}/job.json`;

const buildExpiresAt = () =>
  new Date(Date.now() + DEFAULT_JOB_TTL_MS).toISOString();

const streamToString = async (body: unknown): Promise<string> => {
  if (!body) {
    throw new Error("Missing S3 body.");
  }
  if (body instanceof Uint8Array) {
    return Buffer.from(body).toString("utf8");
  }
  if (typeof body === "string") {
    return body;
  }
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  if (typeof (body as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
    const arrayBuffer = await (body as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer();
    return Buffer.from(arrayBuffer).toString("utf8");
  }
  if (typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === "function") {
    const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Buffer.from(bytes).toString("utf8");
  }
  throw new Error("Unsupported S3 body type.");
};

const isNotFoundError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const code = "Code" in error ? String((error as { Code?: string }).Code) : "";
  const status =
    "$metadata" in error &&
    typeof (error as { $metadata?: { httpStatusCode?: number } }).$metadata
      ?.httpStatusCode === "number"
      ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata
          ?.httpStatusCode
      : null;
  return (
    name === "NoSuchKey" ||
    name === "NotFound" ||
    code === "NoSuchKey" ||
    status === 404
  );
};

export const createJobRecord = async (record: JobRecordInput) => {
  const now = new Date().toISOString();
  const expiresAt = record.expiresAt ?? buildExpiresAt();
  const payload: JobRecord = {
    ...record,
    expiresAt,
    createdAt: record.createdAt || now,
    updatedAt: now,
    outputs: record.outputs ?? [],
  };
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getS3Bucket(),
      Key: jobKey(record.id),
      Body: JSON.stringify(payload),
      ContentType: "application/json; charset=utf-8",
    }),
  );
  return payload;
};

export const getJobRecord = async (jobId: string) => {
  try {
    const response = await getS3Client().send(
      new GetObjectCommand({
        Bucket: getS3Bucket(),
        Key: jobKey(jobId),
      }),
    );
    const text = await streamToString(response.Body);
    return JSON.parse(text) as JobRecord;
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
};

export const updateJobRecord = async (
  jobId: string,
  updates: Partial<JobRecord>,
) => {
  const current = await getJobRecord(jobId);
  if (!current) {
    throw new Error("Job not found.");
  }
  const expiresAt = updates.expiresAt ?? current.expiresAt ?? buildExpiresAt();
  const next: JobRecord = {
    ...current,
    ...updates,
    expiresAt,
    createdAt: current.createdAt,
    outputs: updates.outputs ?? current.outputs,
    updatedAt: new Date().toISOString(),
  };
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getS3Bucket(),
      Key: jobKey(jobId),
      Body: JSON.stringify(next),
      ContentType: "application/json; charset=utf-8",
    }),
  );
  return next;
};
