type UserPlan = "free" | "pro";

type UsageMeterProps = {
  plan: UserPlan;
  jobsUsed: number;
  bytesUsed: number;
  periodStart?: string;
  className?: string;
};

const PLAN_LIMITS: Record<UserPlan, { jobs: number; bytes: number }> = {
  free: { jobs: 20, bytes: 25 * 1024 * 1024 },
  pro: { jobs: 200, bytes: 200 * 1024 * 1024 },
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const formatPeriod = (periodStart?: string) => {
  if (!periodStart) return "This month";
  const date = new Date(periodStart);
  if (Number.isNaN(date.getTime())) return "This month";
  return `Since ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
};

export function UsageMeter({
  plan,
  jobsUsed,
  bytesUsed,
  periodStart,
  className,
}: UsageMeterProps) {
  const limits = PLAN_LIMITS[plan];
  const jobsPercent =
    limits.jobs > 0 ? Math.min(100, (jobsUsed / limits.jobs) * 100) : 0;
  const bytesPercent =
    limits.bytes > 0 ? Math.min(100, (bytesUsed / limits.bytes) * 100) : 0;

  return (
    <section
      className={[
        "rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
            Usage
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
            {formatPeriod(periodStart)}
          </p>
        </div>
        <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:border-[var(--border-2)] dark:text-[var(--muted)]">
          {plan.toUpperCase()} plan
        </span>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-[var(--muted-2)]">
            <span>Jobs used</span>
            <span className="font-semibold text-zinc-700 dark:text-[var(--foreground)]">
              {jobsUsed} / {limits.jobs}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-[var(--surface-3)]">
            <div
              className="h-full rounded-full bg-[var(--brand-500)]"
              style={{ width: `${jobsPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-[var(--muted-2)]">
            <span>Storage used</span>
            <span className="font-semibold text-zinc-700 dark:text-[var(--foreground)]">
              {formatBytes(bytesUsed)} / {formatBytes(limits.bytes)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-[var(--surface-3)]">
            <div
              className="h-full rounded-full bg-[var(--brand-500)]"
              style={{ width: `${bytesPercent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
