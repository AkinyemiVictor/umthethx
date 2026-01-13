import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getConverterBySlug } from "../../../lib/converters";
import { JOB_TABLE, type ConverterJobPayload } from "../../../lib/jobs";
import { getUserPlan } from "../../../lib/plans";
import { getQueue } from "../../../lib/queue";
import { getSupabaseAdminClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";

type EnqueueRequest = {
  converterSlug?: string;
  input?: {
    key?: string;
    fileName?: string;
  };
  options?: Record<string, unknown>;
};

export async function POST(request: Request) {
  let body: EnqueueRequest;
  try {
    body = (await request.json()) as EnqueueRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const converterSlug = body.converterSlug?.trim();
  const inputKey = body.input?.key?.trim();
  if (!converterSlug || !inputKey) {
    return NextResponse.json(
      { error: "converterSlug and input.key are required." },
      { status: 400 },
    );
  }

  const converter = getConverterBySlug(converterSlug);
  if (!converter) {
    return NextResponse.json(
      { error: "Unknown converter slug." },
      { status: 404 },
    );
  }

  const plan = await getUserPlan();
  const jobId = randomUUID();
  const outputKey = `outputs/${jobId}/${converter.slug}.${converter.outputFormat}`;

  const payload: ConverterJobPayload = {
    converterSlug: converter.slug,
    inputKey,
    fileName: body.input?.fileName,
    options: body.options ?? {},
    plan,
    outputKey,
  };

  const supabase = getSupabaseAdminClient();
  const { error: insertError } = await supabase.from(JOB_TABLE).insert({
    id: jobId,
    converter_slug: converter.slug,
    input_key: inputKey,
    output_key: outputKey,
    status: "queued",
    plan,
    options: payload.options ?? {},
  });

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 },
    );
  }

  try {
    const queue = getQueue();
    await queue.add("convert", payload, {
      jobId,
      removeOnComplete: 1000,
      removeOnFail: 1000,
    });
    await queue.close();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to enqueue job.";
    await supabase
      .from(JOB_TABLE)
      .update({ status: "error", error: message })
      .eq("id", jobId);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ jobId, status: "queued" });
}
