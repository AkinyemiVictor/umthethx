import { NextResponse } from "next/server";
import { createPresignedDownloadUrl } from "../../../../src/lib/s3";
import { env } from "../../../lib/env";
import { getSupabaseAdminClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";

type Params = {
  jobId: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<Params> | Params },
) {
  const userId = env.get("PUBLIC_USER_ID");

  const resolvedParams =
    context.params instanceof Promise ? await context.params : context.params;
  const jobId = resolvedParams.jobId;

  const supabase = getSupabaseAdminClient();
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(
      "id, user_id, converter_slug, status, created_at, updated_at, error, total_files, processed_files",
    )
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const { data: files, error: filesError } = await supabase
    .from("files")
    .select(
      "id, job_id, kind, bucket, key, original_name, size_bytes, mime, retained, created_at",
    )
    .eq("job_id", jobId)
    .eq("user_id", userId);

  if (filesError) {
    return NextResponse.json({ error: filesError.message }, { status: 500 });
  }

  const { data: artifacts, error: artifactsError } = await supabase
    .from("job_artifacts")
    .select(
      "id, job_id, file_id, label, created_at, file:files(id, bucket, key, original_name, mime, size_bytes)",
    )
    .eq("job_id", jobId);

  if (artifactsError) {
    return NextResponse.json(
      { error: artifactsError.message },
      { status: 500 },
    );
  }

  const artifactsWithUrls = await Promise.all(
    (artifacts ?? []).map(async (artifact) => {
      const file = Array.isArray(artifact.file) ? artifact.file[0] : artifact.file;
      if (!file?.key) {
        return { ...artifact, downloadUrl: null };
      }
      try {
        const { downloadUrl } = await createPresignedDownloadUrl({
          key: file.key,
          bucket: file.bucket,
        });
        return { ...artifact, downloadUrl };
      } catch {
        return { ...artifact, downloadUrl: null };
      }
    }),
  );

  return NextResponse.json({
    job,
    files: files ?? [],
    artifacts: artifactsWithUrls,
  });
}
