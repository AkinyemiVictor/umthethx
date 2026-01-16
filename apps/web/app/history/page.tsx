import Link from "next/link";
import {
  converters,
  footerConverters,
  getConverterBySlug,
} from "../../src/lib/converters";
import { getHistoryData } from "../../src/lib/history";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

const formatJobTitle = (slug: string) => {
  const converter = getConverterBySlug(slug);
  if (converter) return converter.title;
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const statusLabel = (status: string) => {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return status;
  }
};

export default async function HistoryPage() {
  const history = await getHistoryData();

  return (
    <div className="relative min-h-screen bg-white text-zinc-900 dark:bg-[var(--background)] dark:text-[var(--foreground)]">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <SiteHeader converters={converters} />

        <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">History</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-[var(--muted)]">
                Track recent conversions and download past results.
              </p>
            </div>
          </div>

          {!history ? (
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--muted-2)]">
              Sign in to view your conversion history.
            </div>
          ) : history.jobs.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--muted-2)]">
              No conversions yet. Start with a converter to see results here.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {history.jobs.map((job) => {
                const title = formatJobTitle(job.converter_slug);
                const processed = job.processed_files ?? 0;
                const total = job.total_files ?? 0;
                return (
                  <article
                    key={job.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                          {title}
                        </h2>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                          {formatDate(job.created_at)}
                        </p>
                      </div>
                      <Link
                        href={`/convert/${job.converter_slug}?jobId=${job.id}`}
                        className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-[var(--border-2)] dark:text-[var(--muted)] dark:hover:border-[var(--border-1)] dark:hover:text-[var(--foreground)]"
                      >
                        Open job
                      </Link>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                      <span className="rounded-full border border-zinc-200 px-2 py-0.5 font-semibold text-zinc-600 dark:border-[var(--border-2)] dark:text-[var(--muted)]">
                        {statusLabel(job.status)}
                      </span>
                      {total > 0 ? (
                        <span>
                          {processed}/{total} processed
                        </span>
                      ) : null}
                      {job.status === "failed" && job.error ? (
                        <span className="text-red-600 dark:text-red-400">
                          {job.error}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                        Downloads
                      </div>
                      {job.artifacts.length ? (
                        <ul className="mt-2 grid gap-2 md:grid-cols-2">
                          {job.artifacts.map((artifact) => {
                            const label =
                              artifact.label ||
                              artifact.file?.original_name ||
                              "Artifact";
                            return (
                              <li
                                key={artifact.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--muted)]"
                              >
                                <span className="truncate font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                                  {label}
                                </span>
                                {artifact.downloadUrl ? (
                                  <a
                                    href={artifact.downloadUrl}
                                    className="inline-flex items-center justify-center rounded-full border border-[var(--brand-400)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-500)] transition hover:bg-[var(--brand-50)]"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Download
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-zinc-400">
                                    Processing
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                          No artifacts yet.
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <SiteFooter footerConverters={footerConverters} />
      </div>
    </div>
  );
}
