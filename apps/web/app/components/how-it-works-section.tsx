export type HowItWorksStep = {
  label: string;
  title: string;
  description: string;
};

export function HowItWorksSection({
  title,
  description,
  steps,
}: {
  title: string;
  description: string;
  steps: HowItWorksStep[];
}) {
  return (
    <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          {title}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
          {description}
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {steps.map((step) => (
          <article
            key={step.label}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-[var(--muted-2)]">
              {step.label}
            </p>
            <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)] sm:text-base">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-[var(--muted)]">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
