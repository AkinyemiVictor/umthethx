"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { FileChip } from "@repo/ui/file-chip";
import { JobStatus } from "@repo/ui/job-status";
import { getConverterPrimaryInput, type Converter } from "../lib/converters";
import { languages } from "../lib/languages";

type WorkflowStatus = "queued" | "running" | "success" | "error";

type ConverterWorkflowProps = {
  converter: Converter;
  accept: string;
  uploadLabel: string;
  formatLine: string;
};

const formatBytes = (size: number) => {
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

export function ConverterWorkflow({
  converter,
  accept,
  uploadLabel,
  formatLine,
}: ConverterWorkflowProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const primaryInput = getConverterPrimaryInput(converter);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [outputName, setOutputName] = useState("");
  const [ocrLanguage, setOcrLanguage] = useState(languages[0]?.code ?? "en");

  const resetJobState = () => {
    setStatus(null);
    setJobId(null);
    setDownloadUrl(null);
    setError(null);
  };

  const handleFiles = (selected: File[]) => {
    setFiles(selected);
    resetJobState();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
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
    if (!files.length) {
      setError("Select a file to convert.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setDownloadUrl(null);

    const file = files[0];

    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!presignRes.ok) {
        const payload = await presignRes.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to get upload URL.");
      }

      const presign = (await presignRes.json()) as {
        url: string;
        key: string;
        headers?: Record<string, string>;
      };

      const uploadRes = await fetch(presign.url, {
        method: "PUT",
        headers: presign.headers ?? {},
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed. Try again.");
      }

      const options: Record<string, unknown> = {};
      if (outputName.trim()) {
        options.outputName = outputName.trim();
      }
      if (converter.slug === "image-to-text") {
        options.ocrLanguage = ocrLanguage;
      }

      const enqueueRes = await fetch("/api/jobs/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          converterSlug: converter.slug,
          input: { key: presign.key, fileName: file.name },
          options,
        }),
      });

      if (!enqueueRes.ok) {
        const payload = await enqueueRes.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to start conversion.");
      }

      const enqueuePayload = (await enqueueRes.json()) as { jobId: string };
      setJobId(enqueuePayload.jobId);
      setStatus("queued");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Conversion failed.";
      setError(message);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          job: { status: WorkflowStatus };
          downloadUrl?: string | null;
        };
        if (cancelled) return;
        setStatus(payload.job.status);
        if (payload.downloadUrl) {
          setDownloadUrl(payload.downloadUrl);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to fetch job status.");
        }
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId, status]);

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
            "dark:border-zinc-700 dark:bg-zinc-900/40 dark:shadow-none",
            isDragging ? "border-[var(--brand-500)] bg-[var(--brand-50)]" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
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
          <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Drop, upload, or paste files
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {formatLine}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-500)] px-5 py-2 text-sm font-semibold text-[var(--brand-on)] shadow-sm shadow-black/20 transition hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:shadow-black/40 dark:focus-visible:ring-offset-zinc-950"
              onClick={(event) => {
                event.stopPropagation();
                inputRef.current?.click();
              }}
            >
              Browse files
            </button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
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
          {files.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No files selected yet.
            </p>
          ) : (
            <>
              {files.length > 1 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Multiple files selected. The first file will be converted.
                </p>
              )}
              <ul className="space-y-2">
                {files.map((file) => (
                  <li
                    key={`${file.name}-${file.size}`}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 shadow-sm shadow-black/5 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                  >
                    <span className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                      {file.name}
                    </span>
                    <span className="ml-3 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <FileChip ext={file.name.split(".").pop()} />
                      {formatBytes(file.size)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Options
          </div>
          <div className="mt-3 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Output name (optional)
              </span>
              <input
                type="text"
                value={outputName}
                onChange={(event) => setOutputName(event.target.value)}
                placeholder={`my-file.${converter.outputFormat}`}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus-visible:border-[var(--brand-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              />
            </label>
            {converter.slug === "image-to-text" && (
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  OCR language
                </span>
                <select
                  value={ocrLanguage}
                  onChange={(event) => setOcrLanguage(event.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus-visible:border-[var(--brand-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                >
                  {languages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Status
          </div>
          <div className="mt-3 flex items-center gap-3">
            {status ? (
              <JobStatus ext={converter.outputFormat} state={status} />
            ) : (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Waiting for upload.
              </span>
            )}
            {jobId && (
              <span className="text-xs text-zinc-400">Job #{jobId}</span>
            )}
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || files.length === 0}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--brand-500)] px-5 py-2 text-sm font-semibold text-[var(--brand-on)] shadow-sm shadow-black/20 transition hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:shadow-black/40 dark:focus-visible:ring-offset-zinc-950"
          >
            {isSubmitting ? "Uploading..." : "Convert now"}
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Results
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Your converted file will appear here once processing completes.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <FileChip ext={primaryInput} />
            <span className="text-zinc-400">-&gt;</span>
            <FileChip ext={converter.outputFormat} />
          </div>
          {downloadUrl && (
            <a
              href={downloadUrl}
              className="mt-4 inline-flex items-center justify-center rounded-full border border-[var(--brand-400)] px-4 py-2 text-xs font-semibold text-[var(--brand-500)] transition hover:bg-[var(--brand-50)]"
              target="_blank"
              rel="noreferrer"
            >
              Download results
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
