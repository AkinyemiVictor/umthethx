"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { FileChip } from "@repo/ui/file-chip";
import type { Converter } from "../lib/converters";
import { useTranslations } from "./language-provider";

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
  error?: string | null;
};

type JobOutput = {
  filename: string;
  downloadUrl?: string | null;
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

const mimeByExtension: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  txt: "text/plain",
  html: "text/html",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
  avif: "image/avif",
  heic: "image/heic",
  tif: "image/tiff",
  tiff: "image/tiff",
  bmp: "image/bmp",
};

const getMimeFromFilename = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ext ? mimeByExtension[ext] : undefined;
};

const buildUploadId = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}`;
const MAX_UPLOADS = 5;

export function ConverterWorkflow({
  converter,
  accept,
  uploadLabel,
  formatLine,
}: ConverterWorkflowProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const t = useTranslations();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<JobOutput[]>([]);
  const [textPreview, setTextPreview] = useState("");
  const [textPreviewName, setTextPreviewName] = useState<string | null>(null);
  const [textPreviewError, setTextPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [job, setJob] = useState<JobSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const searchParams = useSearchParams();
  const initialJobId = searchParams?.get("jobId");

  const resetJobState = () => {
    setStatus(null);
    setJobId(null);
    setOutputs([]);
    setTextPreview("");
    setTextPreviewName(null);
    setTextPreviewError(null);
    setIsPreviewLoading(false);
    setIsCopied(false);
    setJob(null);
    setError(null);
  };

  const handleFiles = (selected: File[]) => {
    if (!selected.length) return;
    resetJobState();
    setUploads((current) => {
      const remaining = Math.max(MAX_UPLOADS - current.length, 0);
      if (remaining === 0) {
        setError(t("workflow.fileLimit", { count: MAX_UPLOADS }));
        return current;
      }
      const limited = selected.slice(0, remaining);
      if (selected.length > remaining) {
        setError(t("workflow.fileLimit", { count: MAX_UPLOADS }));
      }
      const nextUploads = limited.map((file) => ({
        id: buildUploadId(file),
        file,
        status: "pending" as UploadStatus,
      }));
      return [...current, ...nextUploads];
    });
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

  const handleClearAll = () => {
    if (isBusy) return;
    setUploads([]);
    resetJobState();
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
      setError(t("workflow.selectFile"));
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setOutputs([]);
    setJob(null);
    setStatus(null);
    setJobId(null);

    const collectedInputs: Array<{
      key: string;
      filename: string;
      contentType: string;
    }> = [];
    let activeJobId: string | null = null;

    try {
      for (const item of uploads) {
        updateUpload(item.id, { status: "uploading", error: undefined });
        const file = item.file;
        const contentType =
          file.type || getMimeFromFilename(file.name) || "application/octet-stream";
        const presignRes = await fetch("/api/uploads/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType,
            sizeBytes: file.size,
            jobId: activeJobId,
          }),
        });

        if (!presignRes.ok) {
          const payload = await presignRes.json().catch(() => ({}));
          throw new Error(payload.error || t("workflow.uploadUrlError"));
        }

        const presign = (await presignRes.json()) as {
          jobId: string;
          uploadUrl: string;
          key: string;
          expiresIn: number;
        };
        activeJobId = presign.jobId;

        const uploadRes = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(t("workflow.uploadFailed"));
        }

        updateUpload(item.id, { status: "uploaded" });
        collectedInputs.push({
          key: presign.key,
          filename: file.name,
          contentType,
        });
      }

      if (!activeJobId) {
        throw new Error(t("workflow.uploadUrlError"));
      }

      const enqueueRes = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          converterSlug: converter.slug,
          jobId: activeJobId,
          inputs: collectedInputs,
        }),
      });

      if (!enqueueRes.ok) {
        const payload = await enqueueRes.json().catch(() => ({}));
        throw new Error(payload.error || t("workflow.startFailed"));
      }

      const enqueuePayload = (await enqueueRes.json()) as { jobId: string };
      setJobId(enqueuePayload.jobId);
      setStatus("queued");
      setJob({
        id: enqueuePayload.jobId,
        status: "queued",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("workflow.conversionFailed");
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
          status: ApiJobStatus;
          outputs?: JobOutput[];
          error?: string | null;
        };
        if (cancelled) return;
        setJob({
          id: jobId,
          status: payload.status,
          error: payload.error ?? null,
        });
        setStatus(mapJobStatus(payload.status));
        setOutputs(payload.outputs ?? []);
        if (payload.status === "failed" && payload.error) {
          setError(payload.error);
        }
      } catch {
        if (!cancelled) {
          setError(t("workflow.fetchStatusFailed"));
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

  const textOutputs = useMemo(
    () =>
      outputs.filter((output) =>
        output.filename.toLowerCase().endsWith(".txt"),
      ),
    [outputs],
  );

  useEffect(() => {
    if (!textOutputs.length) {
      setTextPreview("");
      setTextPreviewName(null);
      setTextPreviewError(null);
      setIsPreviewLoading(false);
      return;
    }

    const active =
      textOutputs.find((output) => output.filename === textPreviewName) ??
      textOutputs[0];
    if (!active?.downloadUrl) {
      return;
    }

    let cancelled = false;
    setIsPreviewLoading(true);
    setTextPreviewError(null);

    fetch(active.downloadUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Preview failed.");
        }
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        setTextPreview(text);
        setTextPreviewName(active.filename);
      })
      .catch(() => {
        if (cancelled) return;
        setTextPreview("");
        setTextPreviewError(t("workflow.previewFailed"));
      })
      .finally(() => {
        if (!cancelled) {
          setIsPreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [textOutputs, textPreviewName, t]);

  const handleCopyText = async () => {
    if (!textPreview.trim()) return;
    try {
      await navigator.clipboard.writeText(textPreview);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setTextPreviewError(t("workflow.copyFailed"));
    }
  };

  const isBusy =
    isSubmitting || job?.status === "queued" || job?.status === "processing";
  const showSidePanel = uploads.length > 0;

  return (
    <div
      className={[
        "mt-6 grid gap-6",
        showSidePanel ? "lg:grid-cols-2" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="min-w-0">
        {textOutputs.length ? (
          <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none lg:h-[360px] lg:min-h-[360px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                {t("workflow.textPreviewTitle")}
              </div>
              <button
                type="button"
                onClick={handleCopyText}
                disabled={!textPreview.trim() || isPreviewLoading}
                aria-label={isCopied ? t("workflow.copied") : t("workflow.copyText")}
                title={isCopied ? t("workflow.copied") : t("workflow.copyText")}
                className="inline-flex items-center justify-center rounded-full border border-[var(--brand-400)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-500)] transition hover:bg-[var(--brand-50)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <rect x="4" y="4" width="11" height="11" rx="2" />
                </svg>
              </button>
            </div>
            {textOutputs.length > 1 ? (
              <select
                className="mt-3 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-600 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--muted)]"
                value={textPreviewName ?? textOutputs[0]?.filename}
                onChange={(event) => setTextPreviewName(event.target.value)}
              >
                {textOutputs.map((output) => (
                  <option key={output.filename} value={output.filename}>
                    {output.filename}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="mt-3 flex-1">
              {isPreviewLoading ? (
                <div className="text-[11px] text-zinc-400 dark:text-[var(--muted-2)]">
                  {t("workflow.previewLoading")}
                </div>
              ) : textPreviewError ? (
                <div className="text-[11px] text-red-600 dark:text-red-400">
                  {textPreviewError}
                </div>
              ) : (
                <textarea
                  readOnly
                  className="h-full min-h-[240px] w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)]"
                  value={textPreview}
                />
              )}
            </div>
          </div>
        ) : (
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
              "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition lg:h-[360px] lg:min-h-[360px]",
              "border-zinc-300 bg-zinc-50/70 shadow-sm shadow-black/10",
              "dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none",
              isDragging
                ? "border-[var(--brand-500)] bg-zinc-200/80 dark:bg-[var(--surface-3)]"
                : "",
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
              {t("workflow.dropLabel")}
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
                {t("workflow.browseFiles")}
              </button>
              <span className="text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                {t("workflow.dragAndDrop")}
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
        )}
      </div>

      {showSidePanel ? (
        <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none lg:h-[360px] lg:min-h-[360px] flex flex-col">
          <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
            {outputs.length
              ? t("workflow.results")
              : t("workflow.selectedFiles")}
          </div>
          <div className="mt-3 flex-1 overflow-y-auto pr-1">
            {outputs.length ? (
              <>
                <ul className="space-y-2 text-xs">
                  {outputs.map((output) => (
                    <li
                      key={output.filename}
                      className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-600 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--muted)]"
                    >
                      <span className="truncate font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                        {output.filename}
                      </span>
                      {output.downloadUrl ? (
                        <a
                          href={output.downloadUrl}
                          download={output.filename}
                          className="inline-flex items-center justify-center rounded-full border border-[var(--brand-400)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-500)] transition hover:bg-[var(--brand-50)]"
                        >
                          {t("workflow.download")}
                        </a>
                      ) : (
                        <span className="text-[11px] text-zinc-400 dark:text-[var(--muted-2)]">
                          {t("workflow.processingLabel")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <ul className="space-y-2 text-xs">
                {uploads.map((item, index) => {
                  const file = item.file;
                  return (
                    <li
                      key={item.id}
                      className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 shadow-sm shadow-black/5 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--muted)]"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                          {file.name}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-[var(--muted-2)]">
                          <FileChip ext={file.name.split(".").pop()} />
                          <span>{formatBytes(file.size)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index, isBusy)}
                        aria-label={t("workflow.removeFileAria", {
                          filename: file.name,
                        })}
                        disabled={isBusy}
                        className="ml-3 inline-grid h-6 w-6 shrink-0 place-items-center rounded-full border border-zinc-200 text-[11px] font-semibold leading-none text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[var(--border-2)] dark:text-[var(--muted-2)] dark:hover:border-[var(--border-1)] dark:hover:text-[var(--foreground)]"
                      >
                        X
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {error && (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isBusy}
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[var(--border-2)] dark:text-[var(--muted-2)] dark:hover:border-[var(--border-1)] dark:hover:text-[var(--foreground)]"
            >
              {t("workflow.clearAll")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isBusy || uploads.length === 0 || status === "success"}
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand-500)] px-5 py-2 text-sm font-semibold text-[var(--brand-on)] shadow-sm shadow-black/20 transition hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:shadow-black/40 dark:focus-visible:ring-offset-[var(--background)]"
            >
              {status === "success"
                ? t("workflow.converted")
                : isSubmitting
                  ? t("workflow.uploading")
                  : isBusy
                    ? t("workflow.processing")
                    : t("workflow.convertNow")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
