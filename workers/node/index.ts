import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { Worker } from "bullmq";
import { randomUUID } from "crypto";
import { QUEUE_NAME, getRedisConnection } from "../../apps/web/src/lib/queue";

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

const supabase = createClient(
  requireEnv("SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: { persistSession: false },
  },
);

const s3 = new S3Client({
  region: requireEnv("AWS_REGION"),
  credentials: {
    accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
  },
});
const bucket = requireEnv("S3_BUCKET");

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
  if (error) {
    payload.error = error;
  }
  await supabase.from("jobs").update(payload).eq("id", jobId);
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

  await updateJobStatus(jobId, "processing");

  const uploadFiles = files ?? [];
  for (const file of uploadFiles) {
    const slug = job.converter_slug;
    const mime = file.mime?.toLowerCase() ?? "";
    let content: string | null = null;

    if (slug === "image-to-text" || slug === "jpeg-to-text" || slug === "png-to-text") {
      content = `OCR pending: file ${file.original_name ?? file.key}`;
    } else if (slug === "pdf-to-text" && mime.startsWith("application/pdf")) {
      content = "PDF text extraction pending";
    }

    if (content) {
      await createArtifact({
        userId: job.user_id,
        jobId,
        originalName: file.original_name ?? "output.txt",
        content,
      });
    }

    await incrementProcessed(jobId);
  }

  await updateJobStatus(jobId, "completed");
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
