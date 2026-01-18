import { NextResponse } from "next/server";
import { getJobRecord } from "../../../../../src/lib/job-store";
import { deleteS3Prefix } from "../../../../../src/lib/s3";

export const runtime = "nodejs";

type Params = {
  jobId: string;
};

type CleanupRequest = {
  force?: boolean;
};

const TERMINAL_STATUSES = new Set(["completed", "failed"]);

export async function POST(
  request: Request,
  context: { params: Promise<Params> | Params },
) {
  const resolvedParams =
    context.params instanceof Promise ? await context.params : context.params;
  const jobId = resolvedParams.jobId;

  let force = false;
  try {
    const body = (await request.json()) as CleanupRequest;
    force = Boolean(body?.force);
  } catch {
    force = false;
  }

  try {
    const job = await getJobRecord(jobId);
    if (job && !force && !TERMINAL_STATUSES.has(job.status)) {
      return NextResponse.json(
        { error: "Job is not in a terminal state." },
        { status: 409 },
      );
    }

    await deleteS3Prefix({ prefix: `temp/${jobId}/` });

    return NextResponse.json({ jobId, deleted: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cleanup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
