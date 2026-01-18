import { NextResponse } from "next/server";
import { getJobRecord } from "../../../../src/lib/job-store";
import { signGetObject } from "../../../../src/lib/s3";

export const runtime = "nodejs";

type Params = {
  jobId: string;
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
        const { downloadUrl } = await signGetObject({ key: output.key });
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
