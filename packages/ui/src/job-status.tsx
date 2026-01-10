import { fileAriaLabel, fileTheme, resolveFileType } from "./lib/fileTheme";

type JobState = "queued" | "running" | "success" | "error";

const stateLabel: Record<JobState, string> = {
  queued: "Queued",
  running: "Running",
  success: "Complete",
  error: "Error",
};

export function JobStatus({
  ext,
  mime,
  state = "queued",
  progress,
  className,
}: {
  ext?: string;
  mime?: string;
  state?: JobState;
  progress?: number;
  className?: string;
}) {
  const { ext: resolvedExt } = resolveFileType({ ext, mime });
  const t = fileTheme(resolvedExt);
  const ariaLabel = fileAriaLabel({ ext, mime });
  const progressValue =
    typeof progress === "number"
      ? Math.min(100, Math.max(0, progress))
      : undefined;
  const isError = state === "error";

  return (
    <div
      role="group"
      aria-label={`${ariaLabel} status`}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        isError ? t.errorBg : t.chipBg,
        isError ? t.errorText : t.chipText,
        isError ? t.errorBorder : t.border,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="uppercase">{stateLabel[state]}</span>
      {typeof progressValue === "number" && state === "running" && (
        <span className="flex items-center gap-2">
          <span className="text-[10px] tabular-nums">{progressValue}%</span>
          <span
            className={`h-1.5 w-16 overflow-hidden rounded-full ${t.progressTrack}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressValue}
          >
            <span
              className={`block h-full ${t.progress}`}
              style={{ width: `${progressValue}%` }}
            />
          </span>
        </span>
      )}
    </div>
  );
}
