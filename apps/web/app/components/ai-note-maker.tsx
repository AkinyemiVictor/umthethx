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
import {
  noteMakerModeOptions,
  noteMakerSubtypeOptions,
  normalizeMode,
  type NoteMakerMode,
} from "../lib/ai-notemaker-types";
import { useTranslations } from "./language-provider";
import {
  DEVICE_ID_HEADER,
  getOrCreateDeviceId,
} from "../../src/lib/device-id";

type NotesResponse = {
  notes: string;
  field?: string;
};

type UploadItem = {
  id: string;
  file: File;
  error?: string;
};

const countWords = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).length;

const getExtension = (fileName: string) =>
  fileName.split(".").pop()?.toLowerCase() ?? "";

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

type InlineToken = {
  text: string;
  bold?: boolean;
  italic?: boolean;
};

type NoteBlock =
  | { type: "blank"; key: string }
  | {
      type: "h1" | "h2" | "h3" | "p" | "ul" | "ol";
      key: string;
      text: string;
      order?: number;
    };

const parseInlineTokens = (value: string): InlineToken[] => {
  const tokens: InlineToken[] = [];
  let index = 0;

  while (index < value.length) {
    if (value.startsWith("**", index)) {
      const end = value.indexOf("**", index + 2);
      if (end !== -1) {
        const text = value.slice(index + 2, end);
        if (text) {
          tokens.push({ text, bold: true });
        }
        index = end + 2;
        continue;
      }
    }

    if (value.startsWith("*", index)) {
      const end = value.indexOf("*", index + 1);
      if (end !== -1) {
        const text = value.slice(index + 1, end);
        if (text) {
          tokens.push({ text, italic: true });
        }
        index = end + 1;
        continue;
      }
    }

    const nextBold = value.indexOf("**", index);
    const nextItalic = value.indexOf("*", index);
    const nextMarker = [nextBold, nextItalic]
      .filter((position) => position !== -1)
      .reduce((smallest, position) => Math.min(smallest, position), value.length);
    if (nextMarker === index) {
      if (value.startsWith("**", index)) {
        tokens.push({ text: "**" });
        index += 2;
        continue;
      }
      tokens.push({ text: value[index] ?? "" });
      index += 1;
      continue;
    }
    const text = value.slice(index, nextMarker);
    if (text) {
      tokens.push({ text });
    }
    index = nextMarker;
  }

  return tokens;
};

const stripInlineMarkdown = (value: string) =>
  value.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");

const parseNoteBlocks = (value: string): NoteBlock[] =>
  value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line, index) => {
      const trimmed = line.trim();
      const key = `${index}-${trimmed.slice(0, 24)}`;

      if (!trimmed) {
        return { type: "blank", key } satisfies NoteBlock;
      }

      if (/^###\s+/.test(trimmed)) {
        return {
          type: "h3",
          key,
          text: trimmed.replace(/^###\s+/, ""),
        } satisfies NoteBlock;
      }

      if (/^##\s+/.test(trimmed)) {
        return {
          type: "h2",
          key,
          text: trimmed.replace(/^##\s+/, ""),
        } satisfies NoteBlock;
      }

      if (/^#\s+/.test(trimmed)) {
        return {
          type: "h1",
          key,
          text: trimmed.replace(/^#\s+/, ""),
        } satisfies NoteBlock;
      }

      const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        return {
          type: "ol",
          key,
          order: Number(orderedMatch[1]),
          text: orderedMatch[2] ?? "",
        } satisfies NoteBlock;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        return {
          type: "ul",
          key,
          text: trimmed.replace(/^[-*]\s+/, ""),
        } satisfies NoteBlock;
      }

      return {
        type: "p",
        key,
        text: trimmed,
      } satisfies NoteBlock;
    });

const renderInlineTokens = (value: string) =>
  parseInlineTokens(value).map((token, index) => {
    if (token.bold && token.italic) {
      return (
        <strong key={index} className="italic">
          {token.text}
        </strong>
      );
    }
    if (token.bold) {
      return <strong key={index}>{token.text}</strong>;
    }
    if (token.italic) {
      return <em key={index}>{token.text}</em>;
    }
    return <span key={index}>{token.text}</span>;
  });

export function AiNoteMakerWorkspace() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState("");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<NoteMakerMode>("smart");
  const [subtype, setSubtype] = useState("");
  const [detectedField, setDetectedField] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<
    "txt" | "pdf" | "docx"
  >("txt");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  const hasNotes = Boolean(notes.trim().length);

  const copyText = useMemo(() => notes.trim(), [notes]);
  const noteBlocks = useMemo(() => parseNoteBlocks(notes.trim()), [notes]);

  const resetNotes = () => {
    setNotes("");
    setError(null);
    setIsCopied(false);
    setDownloadFormat("txt");
    setDetectedField(null);
  };

  const modeLabels = useMemo(
    () =>
      new Map(
        noteMakerModeOptions.map((option) => [
          option.value,
          t(option.labelKey),
        ]),
      ),
    [t],
  );

  const getSubtypeLabel = (modeValue: NoteMakerMode, subtypeValue: string) => {
    if (!subtypeValue || modeValue === "general" || modeValue === "smart") {
      return "";
    }
    const options = noteMakerSubtypeOptions[modeValue] ?? [];
    const match = options.find((option) => option.value === subtypeValue);
    return match ? t(match.labelKey) : "";
  };

  const modeLabel = modeLabels.get(mode) ?? mode;
  const subtypeLabel = getSubtypeLabel(mode, subtype);
  const detectedLabel = detectedField
    ? modeLabels.get(detectedField as NoteMakerMode) ?? detectedField
    : null;

  useEffect(() => {
    const nextMode = normalizeMode(searchParams?.get("mode"));
    const rawSubtype = searchParams?.get("subtype") ?? "";
    let nextSubtype = "";
    if (nextMode !== "general" && nextMode !== "smart") {
      const options = noteMakerSubtypeOptions[nextMode] ?? [];
      if (options.some((option) => option.value === rawSubtype)) {
        nextSubtype = rawSubtype;
      }
    }
    setMode(nextMode);
    setSubtype(nextSubtype);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(hover: none) and (pointer: coarse)");
    const update = () => setIsCoarsePointer(query.matches);
    update();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }

    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

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
      const nextFormat = (() => {
        if (!uploads.length) return "txt" as const;
        const exts = Array.from(
          new Set(uploads.map((item) => getExtension(item.file.name))),
        ).filter(Boolean);
        if (exts.length === 1 && (exts[0] === "pdf" || exts[0] === "docx")) {
          return exts[0] as "pdf" | "docx";
        }
        return "txt" as const;
      })();

      const formData = new FormData();
      if (trimmed) {
        formData.append("text", trimmed);
      }
      formData.append("mode", mode);
      formData.append("specsLabel", t("aiNoteMaker.specsLabel"));
      formData.append("missingLabel", t("aiNoteMaker.notFoundLabel"));
      if (subtype) {
        formData.append("subtype", subtype);
        if (subtypeLabel) {
          formData.append("subtypeLabel", subtypeLabel);
        }
      }
      uploads.forEach((item) => {
        formData.append("files", item.file);
      });
      const deviceId = getOrCreateDeviceId();
      const response = await fetch("/api/ai-notemaker", {
        method: "POST",
        headers: deviceId
          ? {
              [DEVICE_ID_HEADER]: deviceId,
            }
          : undefined,
        body: formData,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || t("aiNoteMaker.errorRequestFailed"));
      }
      const payload = (await response.json()) as NotesResponse;
      setNotes(payload.notes ?? "");
      setDownloadFormat(nextFormat);
      setDetectedField(payload.field ?? null);
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
    const baseName = "notes";
    const filename = `${baseName}.${downloadFormat}`;
    const blocks = noteBlocks.length ? noteBlocks : parseNoteBlocks(notes.trim());
    const downloadBlob = (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    };

    if (downloadFormat === "txt") {
      downloadBlob(new Blob([notes], { type: "text/plain;charset=utf-8" }));
      return;
    }

    setIsDownloading(true);

    if (downloadFormat === "docx") {
      import("docx")
        .then(
          async ({
            Document,
            HeadingLevel,
            Packer,
            Paragraph,
            TextRun,
          }) => {
          const buildRuns = (text: string) =>
            parseInlineTokens(text).map(
              (token) =>
                new TextRun({
                  text: token.text,
                  bold: token.bold,
                  italics: token.italic,
                }),
            );

          const children = blocks.map((block) => {
            if (block.type === "blank") {
              return new Paragraph({ text: "" });
            }
            if (block.type === "h1") {
              return new Paragraph({
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 120, after: 120 },
                children: buildRuns(block.text),
              });
            }
            if (block.type === "h2") {
              return new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 100, after: 80 },
                children: buildRuns(block.text),
              });
            }
            if (block.type === "h3") {
              return new Paragraph({
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 80, after: 60 },
                children: buildRuns(block.text),
              });
            }
            if (block.type === "ul") {
              return new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 60 },
                children: buildRuns(block.text),
              });
            }
            if (block.type === "ol") {
              return new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: `${block.order}. ` }),
                  ...buildRuns(block.text),
                ],
              });
            }
            return new Paragraph({
              spacing: { after: 80 },
              children: buildRuns(block.text),
            });
          });

          const doc = new Document({
            sections: [
              {
                children,
              },
            ],
          });
          const blob = await Packer.toBlob(doc);
          downloadBlob(blob);
        })
        .catch(() => {
          setError(t("aiNoteMaker.errorRequestFailed"));
        })
        .finally(() => setIsDownloading(false));
      return;
    }

    import("pdf-lib")
      .then(async ({ PDFDocument, StandardFonts }) => {
        const pdfDoc = await PDFDocument.create();
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const margin = 50;
        let page = pdfDoc.addPage();
        let { height, width } = page.getSize();
        let cursorY = height - margin;

        const ensureSpace = (requiredHeight: number) => {
          if (cursorY < margin + requiredHeight) {
            page = pdfDoc.addPage();
            const nextSize = page.getSize();
            height = nextSize.height;
            width = nextSize.width;
            cursorY = height - margin;
          }
        };

        const drawWrappedText = ({
          text,
          font,
          fontSize,
          indent = 0,
          spacingAfter = 8,
        }: {
          text: string;
          font: typeof regularFont;
          fontSize: number;
          indent?: number;
          spacingAfter?: number;
        }) => {
          if (!text.trim()) {
            cursorY -= spacingAfter;
            return;
          }
          const lineHeight = fontSize + 4;
          const maxWidth = width - margin * 2 - indent;
          const words = text.split(/\s+/);
          let buffer = "";
          const flush = () => {
            if (!buffer) return;
            ensureSpace(lineHeight);
            page.drawText(buffer, {
              x: margin + indent,
              y: cursorY,
              size: fontSize,
              font,
            });
            cursorY -= lineHeight;
            buffer = "";
          };

          words.forEach((word) => {
            const next = buffer ? `${buffer} ${word}` : word;
            const width = font.widthOfTextAtSize(next, fontSize);
            if (width > maxWidth && buffer) {
              flush();
              buffer = word;
            } else {
              buffer = next;
            }
          });
          flush();
          cursorY -= spacingAfter;
        };

        blocks.forEach((block) => {
          if (block.type === "blank") {
            cursorY -= 4;
            return;
          }
          if (block.type === "h1") {
            drawWrappedText({
              text: stripInlineMarkdown(block.text),
              font: boldFont,
              fontSize: 18,
              spacingAfter: 10,
            });
            return;
          }
          if (block.type === "h2") {
            drawWrappedText({
              text: stripInlineMarkdown(block.text),
              font: boldFont,
              fontSize: 14,
              spacingAfter: 8,
            });
            return;
          }
          if (block.type === "h3") {
            drawWrappedText({
              text: stripInlineMarkdown(block.text),
              font: boldFont,
              fontSize: 12,
              spacingAfter: 6,
            });
            return;
          }
          if (block.type === "ul") {
            drawWrappedText({
              text: `- ${stripInlineMarkdown(block.text)}`,
              font: regularFont,
              fontSize: 11,
              indent: 10,
              spacingAfter: 4,
            });
            return;
          }
          if (block.type === "ol") {
            drawWrappedText({
              text: `${block.order}. ${stripInlineMarkdown(block.text)}`,
              font: regularFont,
              fontSize: 11,
              indent: 10,
              spacingAfter: 4,
            });
            return;
          }
          drawWrappedText({
            text: stripInlineMarkdown(block.text),
            font: regularFont,
            fontSize: 11,
            spacingAfter: 6,
          });
        });
        const pdfBytes = await pdfDoc.save();
        const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
        new Uint8Array(pdfBuffer).set(pdfBytes);
        downloadBlob(new Blob([pdfBuffer], { type: "application/pdf" }));
      })
      .catch(() => {
        setError(t("aiNoteMaker.errorRequestFailed"));
      })
      .finally(() => setIsDownloading(false));
  };

  return (
    <div className="mt-6 space-y-4">
      {hasNotes ? (
        <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
              {t("aiNoteMaker.previewTitle")}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
              {mode !== "general" ? <span>{modeLabel}</span> : null}
              {detectedLabel ? (
                <span>{t("aiNoteMaker.detectedField", { field: detectedLabel })}</span>
              ) : null}
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
                disabled={isDownloading}
                className="inline-flex items-center justify-center rounded-full bg-[var(--brand-500)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-on)] shadow-sm shadow-black/20 transition hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)]"
              >
                {isDownloading
                  ? t("workflow.processing")
                  : t("aiNoteMaker.downloadNotes")}
              </button>
            </div>
          </div>
          <div className="mt-3">
            <div className="max-h-[420px] overflow-y-auto rounded-xl border border-zinc-200 bg-white px-4 py-4 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)]">
              <article className="space-y-3 text-sm leading-6 text-zinc-700 dark:text-[var(--foreground)]">
                {noteBlocks.map((block) => {
                  if (block.type === "blank") {
                    return <div key={block.key} className="h-1.5" />;
                  }
                  if (block.type === "h1") {
                    return (
                      <h1
                        key={block.key}
                        className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-[var(--foreground)]"
                      >
                        {renderInlineTokens(block.text)}
                      </h1>
                    );
                  }
                  if (block.type === "h2") {
                    return (
                      <h2
                        key={block.key}
                        className="pt-2 text-lg font-bold text-zinc-900 dark:text-[var(--foreground)]"
                      >
                        {renderInlineTokens(block.text)}
                      </h2>
                    );
                  }
                  if (block.type === "h3") {
                    return (
                      <h3
                        key={block.key}
                        className="pt-1 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-600 dark:text-[var(--muted)]"
                      >
                        {renderInlineTokens(block.text)}
                      </h3>
                    );
                  }
                  if (block.type === "ul") {
                    return (
                      <div key={block.key} className="flex items-start gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-500)]" />
                        <div className="min-w-0 flex-1">{renderInlineTokens(block.text)}</div>
                      </div>
                    );
                  }
                  if (block.type === "ol") {
                    return (
                      <div key={block.key} className="flex items-start gap-3">
                        <span className="min-w-[1.75rem] shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-[var(--muted-2)]">
                          {block.order}.
                        </span>
                        <div className="min-w-0 flex-1">{renderInlineTokens(block.text)}</div>
                      </div>
                    );
                  }
                  return (
                    <p key={block.key} className="text-sm leading-6 text-zinc-700 dark:text-[var(--foreground)]">
                      {renderInlineTokens(block.text)}
                    </p>
                  );
                })}
              </article>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none lg:h-[360px] lg:min-h-[360px] flex flex-col">
              <div
                role={isCoarsePointer ? undefined : "button"}
                tabIndex={isCoarsePointer ? undefined : 0}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onKeyDown={(event) => {
                  if (isCoarsePointer) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                onClick={() => {
                  if (!isCoarsePointer) {
                    inputRef.current?.click();
                  }
                }}
                style={{ touchAction: "pan-y" }}
                className={[
                  "flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition",
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

              <div className="mt-4 min-h-0 overflow-y-auto">
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

            <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none lg:h-[360px] lg:min-h-[360px] flex flex-col">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                  {t("aiNoteMaker.inputLabel")}
                </div>
                <span className="text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                  {t("aiNoteMaker.inputHint")}
                </span>
              </div>
              <textarea
                className="mt-3 min-h-[160px] w-full flex-1 resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus-visible:border-[var(--brand-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)] dark:placeholder:text-[var(--muted-2)]"
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

        </>
      )}
    </div>
  );
}
