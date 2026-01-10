import { fileAriaLabel, fileTheme, resolveFileType } from "./lib/fileTheme";

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = value < 10 ? 1 : 0;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
};

export function FileCard({
  name,
  size,
  ext,
  mime,
  progress,
  error,
  errorMessage,
  className,
}: {
  name: string;
  size?: number;
  ext?: string;
  mime?: string;
  progress?: number;
  error?: boolean;
  errorMessage?: string;
  className?: string;
}) {
  const { ext: resolvedExt } = resolveFileType({ ext, mime, name });
  const t = fileTheme(resolvedExt);
  const ariaLabel = fileAriaLabel({ ext, mime, name });
  const display = resolvedExt ? resolvedExt.toUpperCase() : "FILE";
  const progressValue =
    typeof progress === "number"
      ? Math.min(100, Math.max(0, progress))
      : undefined;

  return (
    <div
      className={[
        "rounded-2xl border p-4",
        error ? t.errorBorder : t.border,
        error ? t.errorBg : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          role="img"
          aria-label={ariaLabel}
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.chipBg}`}
        >
          <span className={`text-xs font-semibold ${t.chipText}`}>
            {display}
          </span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{name}</div>
          {typeof size === "number" && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatBytes(size)}
            </div>
          )}
        </div>
      </div>

      {typeof progressValue === "number" && (
        <div
          className={`mt-4 h-2 w-full overflow-hidden rounded-full ${t.progressTrack}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressValue}
        >
          <div
            className={`h-full ${t.progress}`}
            style={{ width: `${progressValue}%` }}
          />
        </div>
      )}

      {error && (
        <div className={`mt-3 text-xs font-semibold ${t.errorText}`}>
          {errorMessage || "Error"}
        </div>
      )}
    </div>
  );
}
