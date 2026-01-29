import { NextResponse } from "next/server";
import { getJobRecord } from "../../../../src/lib/job-store";
import { signGetObject } from "../../../../src/lib/s3";

export const runtime = "nodejs";

type Params = {
  jobId: string;
};

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

export async function GET(
  _request: Request,
  context: { params: Promise<Params> | Params },
) {
  const resolvedParams =
    context.params instanceof Promise ? await context.params : context.params;
  const jobId = resolvedParams.jobId;

  const job = await getJobRecord(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
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
