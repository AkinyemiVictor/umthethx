"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { FileChip } from "@repo/ui/file-chip";
import { JobStatus } from "@repo/ui/job-status";
import { getConverterPrimaryInput, type Converter } from "../lib/converters";

type WorkflowStatus = "queued" | "running" | "success" | "error";
type ApiJobStatus = "queued" | "processing" | "completed" | "failed";
type UploadStatus = "pending" | "uploading" | "uploaded" | "failed";

type UploadItem = {
  id: string;
  file: File;
  status: UploadStatus;
  error?: string;
};

type JobSummary = {
  id: string;
  status: ApiJobStatus;
  processed_files?: number | null;
  total_files?: number | null;
  error?: string | null;
};

type JobArtifact = {
  id: string;
  label?: string | null;
  downloadUrl?: string | null;
  file?: {
    original_name?: string | null;
    key?: string | null;
  } | null;
};

type ConverterWorkflowProps = {
  converter: Converter;
  accept: string;
  uploadLabel: string;
  formatLine: string;
};

const mapJobStatus = (status: ApiJobStatus | WorkflowStatus): WorkflowStatus => {
  switch (status) {
    case "processing":
      return "running";
    case "completed":
      return "success";
    case "failed":
      return "error";
    default:
      return status;
  }
};

const formatBytes = (size: number) => {
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const buildUploadId = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}`;

export function ConverterWorkflow({
  converter,
  accept,
  uploadLabel,
  formatLine,
}: ConverterWorkflowProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const primaryInput = getConverterPrimaryInput(converter);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<JobArtifact[]>([]);
  const [job, setJob] = useState<JobSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const searchParams = useSearchParams();
  const initialJobId = searchParams?.get("jobId");

  const resetJobState = () => {
    setStatus(null);
    setJobId(null);
    setArtifacts([]);
    setJob(null);
    setError(null);
  };

  const handleFiles = (selected: File[]) => {
    const nextUploads = selected.map((file) => ({
      id: buildUploadId(file),
      file,
      status: "pending" as UploadStatus,
    }));
    setUploads(nextUploads);
    resetJobState();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const updateUpload = (id: string, updates: Partial<UploadItem>) => {
    setUploads((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    );
  };

  const handleRemoveFile = (index: number, isBusy: boolean) => {
    if (isBusy) return;
    setUploads((current) => {
      const next = current.filter((_, idx) => idx !== index);
      if (next.length === 0) {
        resetJobState();
      }
      return next;
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    handleFiles(selected);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(event.dataTransfer.files ?? []);
    if (dropped.length) {
      handleFiles(dropped);
    }
  };

  const handleSubmit = async () => {
    if (!uploads.length) {
      setError("Select a file to convert.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setArtifacts([]);
    setJob(null);
    setStatus(null);
    setJobId(null);

    const collectedUploads: Array<{
      fileId: string;
      key: string;
      bucket: string;
      originalName: string;
      mime: string;
      sizeBytes: number;
    }> = [];

    try {
      for (const item of uploads) {
        updateUpload(item.id, { status: "uploading", error: undefined });
        const file = item.file;
        const presignRes = await fetch("/api/uploads/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            mime: file.type || "application/octet-stream",
            sizeBytes: file.size,
          }),
        });

        if (!presignRes.ok) {
          const payload = await presignRes.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to get upload URL.");
        }

        const presign = (await presignRes.json()) as {
          uploadUrl: string;
          key: string;
          bucket: string;
          expiresIn: number;
          fileId: string;
        };

        const uploadRes = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("Upload failed. Try again.");
        }

        updateUpload(item.id, { status: "uploaded" });
        collectedUploads.push({
          fileId: presign.fileId,
          key: presign.key,
          bucket: presign.bucket,
          originalName: file.name,
          mime: file.type || "application/octet-stream",
          sizeBytes: file.size,
        });
      }

      const enqueueRes = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          converterSlug: converter.slug,
          uploads: collectedUploads,
        }),
      });

      if (!enqueueRes.ok) {
        const payload = await enqueueRes.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to start conversion.");
      }

      const enqueuePayload = (await enqueueRes.json()) as { jobId: string };
      setJobId(enqueuePayload.jobId);
      setStatus("queued");
      setJob({
        id: enqueuePayload.jobId,
        status: "queued",
        processed_files: 0,
        total_files: collectedUploads.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Conversion failed.";
      setError(message);
      setStatus("error");
      setUploads((current) =>
        current.map((item) =>
          item.status === "uploading"
            ? { ...item, status: "failed", error: message }
            : item,
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!initialJobId || jobId || uploads.length > 0) {
      return;
    }
    setJobId(initialJobId);
    setStatus("queued");
  }, [initialJobId, jobId, uploads.length]);

  useEffect(() => {
    if (!jobId || status === "success" || status === "error") {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) {
          return;
        }
        const payload = (await res.json()) as {
          job: JobSummary;
          artifacts?: JobArtifact[];
        };
        if (cancelled) return;
        setJob(payload.job);
        setStatus(mapJobStatus(payload.job.status));
        setArtifacts(payload.artifacts ?? []);
        if (payload.job.status === "failed" && payload.job.error) {
          setError(payload.job.error);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to fetch job status.");
        }
      }
    };

    poll();
    const interval = setInterval(poll, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId, status]);

  const isBusy =
    isSubmitting || job?.status === "queued" || job?.status === "processing";
  const processedCount = job?.processed_files ?? 0;
  const totalCount = job?.total_files ?? uploads.length;
  const progressPercent =
    totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <div
          role="button"
          tabIndex={0}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onClick={() => inputRef.current?.click()}
          className={[
            "rounded-2xl border-2 border-dashed p-6 text-center transition",
            "border-zinc-300 bg-zinc-50/70 shadow-sm shadow-black/10",
            "dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none",
            isDragging ? "border-[var(--brand-500)] bg-[var(--brand-50)]" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-[var(--surface-3)] dark:text-[var(--muted)]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 16V6" />
              <path d="M8 10l4-4 4 4" />
              <path d="M4 18h16" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
            Drop, upload, or paste files
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
            {formatLine}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-500)] px-5 py-2 text-sm font-semibold text-[var(--brand-on)] shadow-sm shadow-black/20 transition hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:shadow-black/40 dark:focus-visible:ring-offset-[var(--background)]"
              onClick={(event) => {
                event.stopPropagation();
                inputRef.current?.click();
              }}
            >
              Browse files
            </button>
            <span className="text-xs text-zinc-500 dark:text-[var(--muted-2)]">
              or drag and drop
            </span>
          </div>
          <input
            ref={inputRef}
            id="file-upload"
            type="file"
            accept={accept}
            multiple
            className="sr-only"
            aria-label={`Upload ${uploadLabel} files`}
            onChange={handleFileChange}
          />
        </div>

        <div className="mt-4 space-y-2">
          {uploads.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-[var(--muted-2)]">
              No files selected yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {uploads.map((item, index) => {
                const file = item.file;
                const isProcessed =
                  job?.status === "processing" || job?.status === "completed"
                    ? processedCount > index
                    : false;
                const uploadLabel =
                  item.status === "uploading"
                    ? "Uploading"
                    : item.status === "uploaded"
                      ? "Uploaded"
                      : item.status === "failed"
                        ? "Failed"
                        : "Ready";
                const statusLabel =
                  item.status === "failed"
                    ? "Failed"
                    : job?.status === "processing" || job?.status === "completed"
                      ? isProcessed
                        ? "Processed"
                        : "Queued"
                      : uploadLabel;
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 shadow-sm shadow-black/5 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--muted)]"
                  >
                    <span className="min-w-0 truncate font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                      {file.name}
                    </span>
                    <span className="ml-3 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-[var(--muted-2)]">
                      <FileChip ext={file.name.split(".").pop()} />
                      {formatBytes(file.size)}
                      <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:border-[var(--border-2)] dark:text-[var(--muted-2)]">
                        {statusLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index, isBusy)}
                        aria-label={`Remove ${file.name}`}
                        disabled={isBusy}
                        className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[var(--border-2)] dark:text-[var(--muted-2)] dark:hover:border-[var(--border-1)] dark:hover:text-[var(--foreground)]"
                      >
                        Remove
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none">
          <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
            Status
          </div>
          <div className="mt-3 flex items-center gap-3">
            {status ? (
              <JobStatus ext={converter.outputFormat} state={status} />
            ) : (
              <span className="text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                Waiting for upload.
              </span>
            )}
            {jobId && (
              <span className="text-xs text-zinc-400 dark:text-[var(--muted-2)]">Job #{jobId}</span>
            )}
          </div>
          {job ? (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                {processedCount}/{totalCount} files processed
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-[var(--surface-3)]">
                <div
                  className="h-full rounded-full bg-[var(--brand-500)] transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : null}
          {error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isBusy || uploads.length === 0}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--brand-500)] px-5 py-2 text-sm font-semibold text-[var(--brand-on)] shadow-sm shadow-black/20 transition hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:shadow-black/40 dark:focus-visible:ring-offset-[var(--background)]"
          >
            {isSubmitting ? "Uploading..." : isBusy ? "Processing..." : "Convert now"}
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none">
          <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
            Results
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
            Your converted file will appear here once processing completes.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
            <FileChip ext={primaryInput} />
            <span className="text-zinc-400">-&gt;</span>
            <FileChip ext={converter.outputFormat} />
          </div>
          {artifacts.length ? (
            <ul className="mt-4 space-y-2 text-xs">
              {artifacts.map((artifact) => {
                const label =
                  artifact.label ||
                  artifact.file?.original_name ||
                  "Artifact";
                return (
                  <li
                    key={artifact.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-600 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--muted)]"
                  >
                    <span className="truncate font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                      {label}
                    </span>
                    {artifact.downloadUrl ? (
                      <a
                        href={artifact.downloadUrl}
                        className="inline-flex items-center justify-center rounded-full border border-[var(--brand-400)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-500)] transition hover:bg-[var(--brand-50)]"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-[11px] text-zinc-400 dark:text-[var(--muted-2)]">
                        Processing
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
