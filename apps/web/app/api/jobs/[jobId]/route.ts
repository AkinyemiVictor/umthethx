import { NextResponse } from "next/server";
import { getJobRecord, updateJobRecord } from "../../../../src/lib/job-store";
import { signGetObject } from "../../../../src/lib/s3";

export const runtime = "nodejs";

type Params = {
  jobId: string;
};

const MAX_QUEUED_AGE_MS = 10 * 60 * 1000;
const MAX_PROCESSING_AGE_MS = 20 * 60 * 1000;

const contentTypeByExtension: Record<string, string> = {
  txt: "text/plain; charset=utf-8",
  pdf: "application/pdf",
  docx:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx:
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv; charset=utf-8",
  json: "application/json; charset=utf-8",
  html: "text/html; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  zip: "application/zip",
};

const getContentType = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? contentTypeByExtension[ext] : undefined;
};

const parseTimestamp = (value?: string | null) => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getStaleJobFailure = (job: {
  status: "queued" | "processing" | "completed" | "failed";
  createdAt?: string;
  updatedAt?: string;
}) => {
  if (job.status !== "queued" && job.status !== "processing") {
    return null;
  }

  const now = Date.now();
  const lastTouchedAt =
    parseTimestamp(job.updatedAt) ?? parseTimestamp(job.createdAt);
  if (!lastTouchedAt) {
    return null;
  }

  if (job.status === "queued" && now - lastTouchedAt > MAX_QUEUED_AGE_MS) {
    return "Job timed out in queue. The worker may be offline or unable to claim jobs.";
  }

  if (
    job.status === "processing" &&
    now - lastTouchedAt > MAX_PROCESSING_AGE_MS
  ) {
    return "Job processing timed out. The worker may have crashed or lost access to a required dependency.";
  }

  return null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<Params> },
) {
  const { jobId } = await context.params;

  let job = await getJobRecord(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const staleFailure = getStaleJobFailure(job);
  if (staleFailure) {
    job = await updateJobRecord(jobId, {
      status: "failed",
      error: staleFailure,
    });
  }

  const outputs = await Promise.all(
    job.outputs.map(async (output) => {
      try {
        const { downloadUrl } = await signGetObject({
          key: output.key,
          filename: output.filename,
          contentType: getContentType(output.filename),
        });
        return { filename: output.filename, downloadUrl };
      } catch {
        return { filename: output.filename, downloadUrl: null };
      }
    }),
  );

  return NextResponse.json({
    status: job.status,
    outputs,
    error: job.error ?? null,
  });
}
