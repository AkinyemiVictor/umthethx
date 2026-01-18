import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { Worker } from "bullmq";
import { randomUUID } from "crypto";
import pdfParse from "pdf-parse";
import { Readable } from "stream";
import { QUEUE_NAME, getRedisConnection } from "../../apps/web/src/lib/queue";
import {
  detectTextFromImageBytes,
  detectTextFromPdfS3,
} from "../../apps/web/src/lib/textract";

type EnvKey =
  | "SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "AWS_REGION"
  | "AWS_ACCESS_KEY_ID"
  | "AWS_SECRET_ACCESS_KEY"
  | "S3_BUCKET"
  | "REDIS_URL";

const requireEnv = (key: EnvKey) => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
};

const awsRegion = requireEnv("AWS_REGION");
const awsAccessKeyId = requireEnv("AWS_ACCESS_KEY_ID");
const awsSecretAccessKey = requireEnv("AWS_SECRET_ACCESS_KEY");
const bucket = requireEnv("S3_BUCKET");

const supabase = createClient(
  requireEnv("SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: { persistSession: false },
  },
);

const s3 = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
});

const sanitizeFileName = (fileName: string) => {
  const cleaned = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+/, "")
    .trim();
  return cleaned.length > 0 ? cleaned : "file";
};

const stripExtension = (fileName?: string) => {
  if (!fileName) return "file";
  const idx = fileName.lastIndexOf(".");
  return idx > 0 ? fileName.slice(0, idx) : fileName;
};

const createArtifactKey = (options: {
  userId: string;
  jobId: string;
  originalName?: string | null;
}) => {
  const baseName = sanitizeFileName(stripExtension(options.originalName ?? ""));
  const safeName = baseName || "file";
  return `u/${options.userId}/artifacts/${options.jobId}/${safeName}.txt`;
};

const updateJobStatus = async (jobId: string, status: string, error?: string) => {
  const payload: Record<string, unknown> = { status };
  if (typeof error !== "undefined") {
    payload.error = error;
  }
  await supabase.from("jobs").update(payload).eq("id", jobId);
};

const streamToBuffer = async (body: unknown): Promise<Buffer> => {
  if (!body) {
    throw new Error("Missing S3 body.");
  }
  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }
  if (typeof body === "string") {
    return Buffer.from(body);
  }
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  if (typeof (body as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
    const arrayBuffer = await (body as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  if (typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === "function") {
    const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Buffer.from(bytes);
  }
  throw new Error("Unsupported S3 body type.");
};

const getObjectBuffer = async (bucketName: string, key: string) => {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );
  return streamToBuffer(response.Body);
};

const extractTextFromPdfBytes = async (buffer: Buffer) => {
  const parsed = await pdfParse(buffer);
  return parsed.text?.trim() ?? "";
};

const extractTextForFile = async (options: {
  bucket: string;
  key: string;
  mime?: string | null;
}) => {
  const mime = options.mime?.toLowerCase() ?? "";
  if (mime.includes("pdf") || options.key.toLowerCase().endsWith(".pdf")) {
    const bytes = await getObjectBuffer(options.bucket, options.key);
    let text = "";
    try {
      text = await extractTextFromPdfBytes(bytes);
    } catch {
      text = "";
    }
    if (text.length >= 50) {
      return text;
    }
    return detectTextFromPdfS3(options.bucket, options.key);
  }

  const bytes = await getObjectBuffer(options.bucket, options.key);
  return detectTextFromImageBytes(bytes);
};

const incrementProcessed = async (jobId: string) => {
  const { data } = await supabase
    .from("jobs")
    .select("processed_files")
    .eq("id", jobId)
    .single();
  const nextCount = (data?.processed_files ?? 0) + 1;
  await supabase.from("jobs").update({ processed_files: nextCount }).eq("id", jobId);
};

const createArtifact = async (options: {
  userId: string;
  jobId: string;
  originalName?: string | null;
  content: string;
}) => {
  const key = createArtifactKey(options);
  const body = Buffer.from(options.content, "utf8");
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "text/plain; charset=utf-8",
    }),
  );

  const fileId = randomUUID();
  const { error: fileError } = await supabase.from("files").insert({
    id: fileId,
    user_id: options.userId,
    job_id: options.jobId,
    kind: "artifact",
    bucket,
    key,
    original_name: options.originalName ?? "output.txt",
    size_bytes: body.length,
    mime: "text/plain",
    retained: false,
  });

  if (fileError) {
    throw new Error(fileError.message);
  }

  const { error: artifactError } = await supabase.from("job_artifacts").insert({
    id: randomUUID(),
    job_id: options.jobId,
    file_id: fileId,
    label: "text",
  });

  if (artifactError) {
    throw new Error(artifactError.message);
  }
};

const handleJob = async (jobId: string) => {
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, user_id, converter_slug, status")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    throw new Error(jobError?.message ?? "Job not found.");
  }

  const { data: files, error: filesError } = await supabase
    .from("files")
    .select("id, key, bucket, original_name, mime")
    .eq("job_id", jobId)
    .eq("user_id", job.user_id)
    .eq("kind", "upload");

  if (filesError) {
    throw new Error(filesError.message);
  }

  await updateJobStatus(jobId, "processing", null);

  const uploadFiles = files ?? [];
  let successCount = 0;
  const errors: string[] = [];

  for (const file of uploadFiles) {
    try {
      if (!file.key) {
        throw new Error("Missing S3 key.");
      }
      const text = await extractTextForFile({
        bucket: file.bucket ?? bucket,
        key: file.key,
        mime: file.mime,
      });
      if (!text || text.trim().length === 0) {
        throw new Error("No text detected.");
      }

      await createArtifact({
        userId: job.user_id,
        jobId,
        originalName: file.original_name ?? "output.txt",
        content: text,
      });
      successCount += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Extraction failed.";
      errors.push(`${file.original_name ?? file.key}: ${message}`);
    } finally {
      await incrementProcessed(jobId);
    }
  }

  if (successCount === 0) {
    await updateJobStatus(
      jobId,
      "failed",
      errors.length ? errors.join(" | ") : "All files failed.",
    );
    return;
  }

  const warning =
    errors.length > 0 ? `Some files failed: ${errors.join(" | ")}` : null;
  await updateJobStatus(jobId, "completed", warning);
};

const connection = getRedisConnection();

const worker = new Worker(
  QUEUE_NAME,
  async (bullJob) => {
    const jobId = (bullJob.data as { jobId?: string }).jobId;
    if (!jobId) {
      throw new Error("Missing jobId.");
    }
    try {
      await handleJob(jobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Job failed.";
      await updateJobStatus(jobId, "failed", message);
      throw error;
    }
  },
  { connection },
);

worker.on("failed", async (bullJob, error) => {
  const jobId = bullJob?.data?.jobId;
  if (jobId) {
    await updateJobStatus(
      jobId,
      "failed",
      error instanceof Error ? error.message : "Job failed.",
    );
  }
});

const shutdown = async () => {
  await worker.close();
  await connection.quit();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
