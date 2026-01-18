import { NextResponse } from "next/server";
import { converters, getConverterBySlug } from "../../../src/lib/converters";
import {
  createJobRecord,
  getJobRecord,
  type JobInput,
} from "../../../src/lib/job-store";
import { getQueue } from "../../../src/lib/queue";

export const runtime = "nodejs";

type CreateJobRequest = {
  converterSlug?: string;
  jobId?: string;
  inputs?: JobInput[];
  uploads?: JobInput[];
};

const MAX_BATCH_SIZE = 5;
const MAX_FILENAME_LENGTH = 180;

const { allowedMimeTypes, wildcardPrefixes } = converters.reduce(
  (acc, converter) => {
    converter.accept.mimeTypes.forEach((mime) => {
      if (mime.includes("/*")) {
        acc.wildcardPrefixes.add(mime.split("/")[0] + "/");
      } else {
        acc.allowedMimeTypes.add(mime.toLowerCase());
      }
    });
    return acc;
  },
  {
    allowedMimeTypes: new Set<string>(),
    wildcardPrefixes: new Set<string>(),
  },
);

const normalizeMime = (mime: string) => mime.toLowerCase().split(";")[0]?.trim();

const isMimeAllowed = (mime?: string) => {
  const normalized = mime ? normalizeMime(mime) : "";
  if (!normalized) return false;
  if (allowedMimeTypes.has(normalized)) return true;
  for (const prefix of wildcardPrefixes) {
    if (normalized.startsWith(prefix)) {
      return true;
    }
  }
  return false;
};

const isSafeFilename = (name: string) =>
  name.length > 0 &&
  name.length <= MAX_FILENAME_LENGTH &&
  !/[\\/]/.test(name) &&
  !/\.\./.test(name) &&
  !/[\u0000-\u001F]/.test(name);

const isSafeKey = (key: string) =>
  !/[\u0000-\u001F]/.test(key) && !/\\/.test(key) && !/\.\./.test(key);

const isInputAccepted = (converterSlug: string, input: JobInput) => {
  const converter = getConverterBySlug(converterSlug);
  if (!converter) return false;
  const normalizedMime = normalizeMime(input.contentType);
  for (const mime of converter.accept.mimeTypes) {
    if (mime.includes("/*")) {
      const prefix = mime.split("/")[0];
      if (normalizedMime.startsWith(`${prefix}/`)) {
        return true;
      }
    }
  }
  if (
    converter.accept.mimeTypes.some(
      (mime) => normalizeMime(mime) === normalizedMime,
    )
  ) {
    return true;
  }
  const ext = input.filename.split(".").pop()?.toLowerCase() ?? "";
  return converter.accept.extensions.includes(ext);
};

export async function POST(request: Request) {
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
  const jobId = body.jobId?.trim();
  const inputs = (body.inputs ?? body.uploads ?? []) as JobInput[];

  if (!converterSlug) {
    return NextResponse.json(
      { error: "converterSlug is required." },
      { status: 400 },
    );
  }

  if (!jobId || jobId.includes("/") || jobId.includes("..")) {
    return NextResponse.json({ error: "jobId is required." }, { status: 400 });
  }

  if (!Array.isArray(inputs) || inputs.length === 0) {
    return NextResponse.json(
      { error: "At least one input is required." },
      { status: 400 },
    );
  }

  if (inputs.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      { error: "Batch size exceeds the 5 file limit." },
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

  const prefix = `temp/${jobId}/uploads/`;
  for (const input of inputs) {
    const key = input.key?.trim();
    const filename = input.filename?.trim();
    const contentType = input.contentType?.trim();
    if (!key || !filename || !contentType) {
      return NextResponse.json(
        { error: "Each input must include key, filename, and contentType." },
        { status: 400 },
      );
    }
    if (!key.startsWith(prefix) || !isSafeKey(key)) {
      return NextResponse.json(
        { error: "Input key must be under the upload prefix." },
        { status: 400 },
      );
    }
    if (!isSafeFilename(filename)) {
      return NextResponse.json(
        { error: "filename is invalid." },
        { status: 400 },
      );
    }
    if (!isMimeAllowed(contentType)) {
      return NextResponse.json(
        { error: "File type is not supported." },
        { status: 415 },
      );
    }
    if (!isInputAccepted(converter.slug, input)) {
      return NextResponse.json(
        { error: "Input is not supported by this converter." },
        { status: 415 },
      );
    }
  }

  const existingJob = await getJobRecord(jobId);
  if (existingJob) {
    return NextResponse.json(
      { error: "jobId already exists." },
      { status: 409 },
    );
  }

  await createJobRecord({
    id: jobId,
    status: "queued",
    converterSlug: converter.slug,
    inputs: inputs.map((input) => ({
      key: input.key.trim(),
      filename: input.filename.trim(),
      contentType: input.contentType.trim(),
    })),
    outputs: [],
  });

  try {
    const queue = getQueue();
    await queue.add(
      "convert",
      {
        jobId,
      },
      { jobId, removeOnComplete: 1000, removeOnFail: 1000 },
    );
    await queue.close();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to enqueue job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ jobId });
}
