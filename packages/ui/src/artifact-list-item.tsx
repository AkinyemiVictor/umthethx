import { fileAriaLabel, fileTheme, resolveFileType } from "./lib/fileTheme";

export function ArtifactListItem({
  name,
  status,
  ext,
  mime,
  progress,
  error,
  className,
}: {
  name: string;
  status?: string;
  ext?: string;
  mime?: string;
  progress?: number;
  error?: boolean;
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
        "flex items-center justify-between gap-4 rounded-xl border px-3 py-2",
        error ? t.errorBorder : t.border,
        error ? t.errorBg : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          role="img"
          aria-label={ariaLabel}
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.chipBg}`}
        >
          <span className={`text-[10px] font-semibold ${t.chipText}`}>
            {display}
          </span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{name}</div>
          {status && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {status}
            </div>
          )}
        </div>
      </div>

      {typeof progressValue === "number" && (
        <div className="w-28">
          <div
            className={`h-2 w-full overflow-hidden rounded-full ${t.progressTrack}`}
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
        </div>
      )}
    </div>
  );
}
