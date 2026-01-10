import { fileAriaLabel, fileTheme, resolveFileType } from "./lib/fileTheme";

export function FileChip({
  ext,
  mime,
  name,
  className,
}: {
  ext?: string;
  mime?: string;
  name?: string;
  className?: string;
}) {
  const { ext: resolvedExt } = resolveFileType({ ext, mime, name });
  const t = fileTheme(resolvedExt);
  const ariaLabel = fileAriaLabel({ ext, mime, name });
  const display = resolvedExt ? resolvedExt.toUpperCase() : "FILE";

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold",
        t.chipBg,
        t.chipText,
        t.border,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {display}
    </span>
  );
}
