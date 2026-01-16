import { NextResponse } from "next/server";
import { getAuthUser, getSupabaseServerClient } from "../../../../src/lib/auth-server";
import { deleteS3Object } from "../../../../src/lib/s3";

export const runtime = "nodejs";

type Params = {
  id: string;
};

type PatchPayload = {
  retained?: boolean;
  delete?: boolean;
};

type FileRecord = {
  id: string;
  job_id?: string | null;
  key?: string | null;
  bucket?: string | null;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<Params> | Params },
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: PatchPayload;
  try {
    body = (await request.json()) as PatchPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const wantsDelete = body.delete === true;
  const wantsRetained = typeof body.retained === "boolean";
  if ((wantsDelete && wantsRetained) || (!wantsDelete && !wantsRetained)) {
    return NextResponse.json(
      { error: "Provide either retained or delete." },
      { status: 400 },
    );
  }

  const resolvedParams =
    context.params instanceof Promise ? await context.params : context.params;
  const fileId = resolvedParams.id?.trim();

  if (!fileId) {
    return NextResponse.json({ error: "Missing file id." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data: file, error: fileError } = await supabase
    .from("files")
    .select("id, job_id, key, bucket")
    .eq("id", fileId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fileError) {
    return NextResponse.json({ error: fileError.message }, { status: 500 });
  }

  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  if (wantsRetained) {
    const { data: updated, error: updateError } = await supabase
      .from("files")
      .update({ retained: body.retained })
      .eq("id", fileId)
      .eq("user_id", user.id)
      .select("id, retained")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      id: updated?.id ?? fileId,
      retained: updated?.retained ?? body.retained,
    });
  }

  let filesToDelete: FileRecord[] = [file];
  const jobId = file.job_id ?? null;

  if (jobId) {
    const { data: relatedFiles, error: relatedError } = await supabase
      .from("files")
      .select("id, job_id, key, bucket")
      .eq("job_id", jobId)
      .eq("user_id", user.id);

    if (relatedError) {
      return NextResponse.json(
        { error: relatedError.message },
        { status: 500 },
      );
    }

    if (relatedFiles && relatedFiles.length > 0) {
      filesToDelete = relatedFiles;
    }
  }

  const uniqueFiles = new Map<string, FileRecord>();
  for (const record of filesToDelete) {
    if (record?.id) {
      uniqueFiles.set(record.id, record);
    }
  }

  try {
    for (const record of uniqueFiles.values()) {
      if (!record.key) {
        continue;
      }
      await deleteS3Object({
        key: record.key,
        bucket: record.bucket ?? undefined,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete files.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (jobId) {
    const { error: artifactsError } = await supabase
      .from("job_artifacts")
      .delete()
      .eq("job_id", jobId);

    if (artifactsError) {
      return NextResponse.json(
        { error: artifactsError.message },
        { status: 500 },
      );
    }
  }

  const fileIds = Array.from(uniqueFiles.values()).map((record) => record.id);
  const { error: deleteError } = await supabase
    .from("files")
    .delete()
    .in("id", fileIds)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    deleted: fileIds,
    jobId,
  });
}
