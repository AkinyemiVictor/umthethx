import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { Worker } from "bullmq";
import { JOB_TABLE, type ConverterJobPayload } from "../app/lib/jobs";
import { QUEUE_NAME, getRedisConnection } from "../app/lib/queue";
import { getS3BucketName, getS3Client } from "../app/lib/s3";
import { getSupabaseAdminClient } from "../app/lib/supabase/server";

const connection = getRedisConnection();
const supabase = getSupabaseAdminClient();
const s3 = getS3Client();
const bucket = getS3BucketName();

const updateJobStatus = async (
  jobId: string,
  status: "queued" | "running" | "success" | "error",
  errorMessage?: string,
) => {
  const payload: Record<string, unknown> = { status };
  if (errorMessage) {
    payload.error = errorMessage;
  }
  await supabase.from(JOB_TABLE).update(payload).eq("id", jobId);
};

const worker = new Worker<ConverterJobPayload>(
  QUEUE_NAME,
  async (job) => {
    const jobId = job.id?.toString() ?? "";
    if (jobId) {
      await updateJobStatus(jobId, "running");
    }

    // TODO: replace this stub with real conversion logic (Node -> Python worker later).
    if (job.data.inputKey && job.data.outputKey) {
      await s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${job.data.inputKey}`,
          Key: job.data.outputKey,
        }),
      );
    }

    if (jobId) {
      await updateJobStatus(jobId, "success");
    }

    return { outputKey: job.data.outputKey ?? null };
  },
  { connection },
);

worker.on("failed", async (job, err) => {
  const jobId = job?.id?.toString();
  if (jobId) {
    await updateJobStatus(jobId, "error", err?.message || "Job failed.");
  }
});

const shutdown = async () => {
  await worker.close();
  await connection.quit();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
