"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { FileChip } from "@repo/ui/file-chip";
import { useTranslations } from "./language-provider";

type NotesResponse = {
  notes: string;
};

type UploadItem = {
  id: string;
  file: File;
  error?: string;
};

const countWords = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).length;

const buildUploadId = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}`;

const MAX_UPLOADS = 5;

const formatBytes = (size: number) => {
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

export function AiNoteMakerWorkspace() {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState("");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const hasNotes = Boolean(notes.trim().length);

  const copyText = useMemo(() => notes.trim(), [notes]);

  const resetNotes = () => {
    setNotes("");
    setError(null);
    setIsCopied(false);
  };

  const handleFiles = (selected: File[]) => {
    if (!selected.length) return;
    resetNotes();
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
      }));
      return [...current, ...nextUploads];
    });
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

  const handleRemoveFile = (index: number) => {
    setUploads((current) => {
      const next = current.filter((_, idx) => idx !== index);
      if (next.length === 0) {
        resetNotes();
      }
      return next;
    });
  };

  const handleClearAll = () => {
    setUploads([]);
    resetNotes();
  };

  const handleGenerate = async () => {
    const trimmed = text.trim();
    if (!trimmed && uploads.length === 0) {
      setError(t("aiNoteMaker.errorEmpty"));
      return;
    }
    if (trimmed && uploads.length === 0 && countWords(trimmed) < 30) {
      setError(t("aiNoteMaker.errorTooShort"));
      return;
    }
    setError(null);
    setIsLoading(true);
    setIsCopied(false);

    try {
      const formData = new FormData();
      if (trimmed) {
        formData.append("text", trimmed);
      }
      uploads.forEach((item) => {
        formData.append("files", item.file);
      });
      const response = await fetch("/api/ai-notemaker", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || t("aiNoteMaker.errorRequestFailed"));
      }
      const payload = (await response.json()) as NotesResponse;
      setNotes(payload.notes ?? "");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("aiNoteMaker.errorRequestFailed");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setError(t("workflow.copyFailed"));
    }
  };

  const handleDownload = () => {
    if (!notes.trim()) return;
    const blob = new Blob([notes], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "notes.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="mt-6 space-y-4">
      {hasNotes ? (
        <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
              {t("aiNoteMaker.previewTitle")}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => resetNotes()}
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-800 dark:border-[var(--border-2)] dark:text-[var(--muted-2)] dark:hover:border-[var(--border-1)] dark:hover:text-[var(--foreground)]"
              >
                {t("aiNoteMaker.backToInputs")}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={isCopied ? t("workflow.copied") : t("workflow.copyText")}
                title={isCopied ? t("workflow.copied") : t("workflow.copyText")}
                className="inline-flex items-center justify-center rounded-full border border-[var(--brand-400)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-500)] transition hover:bg-[var(--brand-50)]"
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
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center justify-center rounded-full bg-[var(--brand-500)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-on)] shadow-sm shadow-black/20 transition hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)]"
              >
                {t("aiNoteMaker.downloadNotes")}
              </button>
            </div>
          </div>
          <div className="mt-3">
            <textarea
              readOnly
              className="h-[420px] w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)]"
              value={notes}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none">
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
                  "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition",
                  "border-zinc-300 bg-zinc-50/70 shadow-sm shadow-black/10",
                  "dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:shadow-none",
                  isDragging
                    ? "border-[var(--brand-500)] bg-zinc-200/80 dark:bg-[var(--surface-2)]"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-[var(--surface-2)] dark:text-[var(--muted)]">
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
                  {t("aiNoteMaker.supportedFormats")}
                </p>
                <div className="mt-5 flex flex-col items-center justify-center gap-2">
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
                  id="note-files"
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  multiple
                  className="sr-only"
                  aria-label="Upload PDF, DOCX, or TXT files"
                  onChange={handleFileChange}
                />
              </div>

              <div className="mt-4">
                {uploads.length ? (
                  <ul className="space-y-2 text-xs">
                    {uploads.map((item, index) => (
                      <li
                        key={item.id}
                        className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 shadow-sm shadow-black/5 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--muted)]"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                            {item.file.name}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-[var(--muted-2)]">
                            <FileChip ext={item.file.name.split(".").pop()} />
                            <span>{formatBytes(item.file.size)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          aria-label={t("workflow.removeFileAria", {
                            filename: item.file.name,
                          })}
                          className="ml-3 inline-grid h-6 w-6 shrink-0 place-items-center rounded-full border border-zinc-200 text-[11px] font-semibold leading-none text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700 dark:border-[var(--border-2)] dark:text-[var(--muted-2)] dark:hover:border-[var(--border-1)] dark:hover:text-[var(--foreground)]"
                        >
                          X
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                    {t("workflow.noFilesSelected")}
                  </p>
                )}
                {uploads.length ? (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="mt-3 inline-flex items-center justify-center rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-800 dark:border-[var(--border-2)] dark:text-[var(--muted-2)] dark:hover:border-[var(--border-1)] dark:hover:text-[var(--foreground)]"
                  >
                    {t("workflow.clearAll")}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                  {t("aiNoteMaker.inputLabel")}
                </div>
                <span className="text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                  {t("aiNoteMaker.inputHint")}
                </span>
              </div>
              <textarea
                className="mt-3 h-40 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus-visible:border-[var(--brand-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)] dark:placeholder:text-[var(--muted-2)]"
                placeholder={t("aiNoteMaker.inputPlaceholder")}
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  if (error) {
                    setError(null);
                  }
                }}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                  {t("aiNoteMaker.suggestedLength")}
                </span>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="inline-flex items-center rounded-full bg-[var(--brand-500)] px-4 py-2 text-xs font-semibold text-[var(--brand-on)] shadow-sm shadow-black/20 transition hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-black/40 dark:focus-visible:ring-offset-[var(--background)]"
                >
                  {isLoading ? t("workflow.processing") : t("aiNoteMaker.generate")}
                </button>
              </div>
              {error ? (
                <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                {t("aiNoteMaker.previewTitle")}
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-[var(--muted)]">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-zinc-700 dark:bg-[var(--muted)]" />
                {t("aiNoteMaker.previewBullet1")}
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-zinc-700 dark:bg-[var(--muted)]" />
                {t("aiNoteMaker.previewBullet2")}
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-zinc-700 dark:bg-[var(--muted)]" />
                {t("aiNoteMaker.previewBullet3")}
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)]">
                {t("aiNoteMaker.previewTagSummary")}
              </span>
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)]">
                {t("aiNoteMaker.previewTagKeyPoints")}
              </span>
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)]">
                {t("aiNoteMaker.previewTagActionItems")}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
