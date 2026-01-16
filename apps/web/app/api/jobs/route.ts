import { NextResponse } from "next/server";
import { getConverterBySlug } from "../../../src/lib/converters";
import { getAuthUser, getSupabaseServerClient } from "../../../src/lib/auth-server";
import { getQueue } from "../../../src/lib/queue";

export const runtime = "nodejs";

type UploadInput = {
  fileId?: string;
  key?: string;
  bucket?: string;
  originalName?: string;
  mime?: string;
  sizeBytes?: number;
};

type CreateJobRequest = {
  converterSlug?: string;
  uploads?: UploadInput[];
};

const MAX_BATCH_SIZE = 20;

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: CreateJobRequest;
  try {
    body = (await request.json()) as CreateJobRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const converterSlug = body.converterSlug?.trim();
  const uploads = body.uploads ?? [];

  if (!converterSlug) {
    return NextResponse.json(
      { error: "converterSlug is required." },
      { status: 400 },
    );
  }

  if (!Array.isArray(uploads) || uploads.length === 0) {
    return NextResponse.json(
      { error: "At least one upload is required." },
      { status: 400 },
    );
  }

  if (uploads.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      { error: "Batch size exceeds the 20 file limit." },
      { status: 413 },
    );
  }

  const converter = getConverterBySlug(converterSlug);
  if (!converter) {
    return NextResponse.json(
      { error: "Unknown converter slug." },
      { status: 404 },
    );
  }

  const uploadIds = uploads
    .map((upload) => upload.fileId?.trim())
    .filter(Boolean) as string[];

  if (uploadIds.length !== uploads.length) {
    return NextResponse.json(
      { error: "Every upload must include a fileId." },
      { status: 400 },
    );
  }

  const invalidUpload = uploads.find(
    (upload) =>
      !upload.key?.trim() ||
      !upload.bucket?.trim() ||
      !upload.originalName?.trim() ||
      !upload.mime?.trim() ||
      !Number.isFinite(upload.sizeBytes),
  );

  if (invalidUpload) {
    return NextResponse.json(
      { error: "Each upload must include key, bucket, originalName, mime, and sizeBytes." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data: jobRow, error: jobError } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      converter_slug: converter.slug,
      status: "queued",
      total_files: uploads.length,
      processed_files: 0,
    })
    .select("id")
    .single();

  if (jobError || !jobRow?.id) {
    return NextResponse.json(
      { error: jobError?.message ?? "Failed to create job." },
      { status: 500 },
    );
  }

  const { data: updatedFiles, error: filesError } = await supabase
    .from("files")
    .update({ job_id: jobRow.id })
    .in("id", uploadIds)
    .eq("user_id", user.id)
    .select("id");

  if (filesError) {
    await supabase.from("jobs").delete().eq("id", jobRow.id);
    return NextResponse.json(
      { error: filesError.message },
      { status: 500 },
    );
  }

  if ((updatedFiles?.length ?? 0) !== uploads.length) {
    await supabase.from("jobs").delete().eq("id", jobRow.id);
    return NextResponse.json(
      { error: "One or more uploads could not be attached to the job." },
      { status: 400 },
    );
  }

  try {
    const queue = getQueue();
    await queue.add(
      "convert",
      {
        jobId: jobRow.id,
      },
      { jobId: jobRow.id, removeOnComplete: 1000, removeOnFail: 1000 },
    );
    await queue.close();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to enqueue job.";
    await supabase
      .from("jobs")
      .update({ status: "failed", error: message })
      .eq("id", jobRow.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ jobId: jobRow.id });
}
