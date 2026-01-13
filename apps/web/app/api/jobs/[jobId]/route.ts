import { NextResponse } from "next/server";
import { JOB_TABLE } from "../../../lib/jobs";
import { createDownloadUrl } from "../../../lib/s3";
import { getSupabaseAdminClient } from "../../../lib/supabase/server";

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

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(JOB_TABLE)
    .select(
      "id, converter_slug, input_key, output_key, status, plan, options, error, created_at, updated_at",
    )
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  let downloadUrl: string | null = null;
  if (data.status === "success" && data.output_key) {
    try {
      downloadUrl = await createDownloadUrl(data.output_key);
    } catch {
      downloadUrl = null;
    }
  }

  return NextResponse.json({
    job: data,
    downloadUrl,
  });
}
