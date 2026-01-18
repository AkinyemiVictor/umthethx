"use client";

type AdOverlayProps = {
  open: boolean;
  onClose: () => void;
  label?: string;
};

export function AdOverlay({
  open,
  onClose,
  label = "Advertisement",
}: AdOverlayProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-xl shadow-black/20 dark:border-[var(--border-2)] dark:bg-[var(--surface-1)] dark:shadow-black/40"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-400">
          Sponsored
        </div>
        <div className="mt-3 text-xl font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          Conversion complete
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-[var(--muted)]">
          Your files are ready. This space can display an ad.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 inline-flex items-center justify-center rounded-full bg-[var(--brand-500)] px-5 py-2 text-xs font-semibold text-[var(--brand-on)] shadow-sm shadow-black/20 transition hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:shadow-black/40 dark:focus-visible:ring-offset-[var(--background)]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
