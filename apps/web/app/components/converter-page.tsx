import Link from "next/link";
import { FileChip } from "@repo/ui/file-chip";
import type { Converter } from "../lib/converters";
import {
  converters,
  footerConverters,
  getConverterAccept,
  getConverterFormats,
  getConverterHref,
} from "../lib/converters";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

const featureHighlights = [
  {
    label: "Free to use",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12.5 11 15l4.5-5" />
      </svg>
    ),
  },
  {
    label: "AI-based extraction",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="7" y="7" width="10" height="10" rx="2" />
        <path d="M9 3v2" />
        <path d="M15 3v2" />
        <path d="M9 19v2" />
        <path d="M15 19v2" />
        <path d="M3 9h2" />
        <path d="M3 15h2" />
        <path d="M19 9h2" />
        <path d="M19 15h2" />
      </svg>
    ),
  },
  {
    label: "Supports multiple languages",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.4 3 2.4 15 0 18" />
        <path d="M12 3c-2.4 3-2.4 15 0 18" />
      </svg>
    ),
  },
];

const buildHowItWorks = (outputLabel: string) => [
  {
    title: "Drop your file",
    description: "Drop files or browse your device to get started.",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 4v9" />
        <path d="M8 8l4-4 4 4" />
        <path d="M4 20h16" />
      </svg>
    ),
  },
  {
    title: "Convert",
    description: `Convert to ${outputLabel} in seconds.`,
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12h11" />
        <path d="M11 7l4 5-4 5" />
        <path d="M20 7v10" />
      </svg>
    ),
  },
  {
    title: "Download results",
    description: "Save, share, or continue working right away.",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20V11" />
        <path d="M8 16l4 4 4-4" />
        <path d="M4 4h16v5H4z" />
      </svg>
    ),
  },
];

function AdSlot({ label }: { label: string }) {
  return (
    <div
      aria-label={label}
      className="flex min-h-[120px] w-full items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/70 text-sm font-semibold text-zinc-500 shadow-sm shadow-orange-100/60 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-400 dark:shadow-none"
    >
      Ad space
    </div>
  );
}

export function ConverterPage({ converter }: { converter: Converter }) {
  const formats = getConverterFormats(converter);
  const outputLabel = converter.to.toUpperCase();
  const inputLabel = converter.from.toUpperCase();
  const uploadLabel =
    converter.slug === "image-to-text" ? "image or PDF" : inputLabel;
  const accept = getConverterAccept(converter);
  const howItWorks = buildHowItWorks(outputLabel);
  const formatLine =
    converter.slug === "image-to-text"
      ? `Supported formats: ${formats.join(", ")} and more.`
      : `Supported format: ${formats.join(", ")}.`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 text-zinc-900 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 dark:text-zinc-50">
      <div className="pointer-events-none absolute -top-32 right-[-120px] h-72 w-72 rounded-full bg-orange-200/40 blur-3xl dark:bg-orange-500/10" />
      <div className="pointer-events-none absolute -bottom-28 left-[-80px] h-72 w-72 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <SiteHeader converters={converters} currentSlug={converter.slug} />

        <section className="rounded-3xl border border-orange-100 bg-white/80 p-6 shadow-sm shadow-orange-100/80 backdrop-blur dark:border-orange-500/20 dark:bg-zinc-950/80 dark:shadow-none">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600 dark:text-orange-400">
              {converter.title}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {converter.title} Converter
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {converter.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <FileChip ext={converter.from} />
              <span className="text-zinc-400">-&gt;</span>
              <FileChip ext={converter.to} />
            </div>
          </div>
          <div className="mt-6 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/50 p-6 text-center shadow-sm shadow-orange-100/60 dark:border-orange-500/30 dark:bg-orange-500/5 dark:shadow-none">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
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
            <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Drop, upload, or paste files
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {formatLine}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <label
                htmlFor="file-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-zinc-950 shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 active:bg-orange-700 active:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:shadow-orange-500/10 dark:focus-visible:ring-offset-zinc-950"
              >
                Browse files
              </label>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                or drag and drop
              </span>
            </div>
            <input
              id="file-upload"
              type="file"
              accept={accept}
              multiple
              className="sr-only"
              aria-label={`Upload ${uploadLabel} files`}
            />
          </div>
        </section>

        <AdSlot label="Advertisement slot" />

        <section
          id="converters"
          className="rounded-3xl border border-orange-100 bg-white/70 p-6 shadow-sm shadow-orange-100/80 backdrop-blur dark:border-orange-500/20 dark:bg-zinc-950/80 dark:shadow-none"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Converters</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Switch to another converter in one click.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {converters.map((item) => {
              const isActive = item.slug === converter.slug;
              return (
                <Link
                  key={item.slug}
                  href={getConverterHref(item)}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "rounded-2xl border p-4 transition",
                    "border-zinc-200 bg-white/80 hover:border-orange-200 hover:bg-orange-50",
                    "dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10",
                    isActive
                      ? "border-orange-300 bg-orange-50 dark:border-orange-400/40 dark:bg-orange-500/10"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {item.title}
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {item.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <FileChip ext={item.from} />
                    <span className="text-zinc-400">-&gt;</span>
                    <FileChip ext={item.to} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <AdSlot label="Advertisement slot" />

        <section className="rounded-3xl border border-orange-100 bg-white/70 p-6 shadow-sm shadow-orange-100/80 backdrop-blur dark:border-orange-500/20 dark:bg-zinc-950/80 dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">How it works</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Simple steps to move from source files to finished results.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {howItWorks.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-zinc-200 bg-white/80 p-4 transition hover:border-orange-200 hover:bg-orange-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                    {step.icon}
                  </div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {step.title}
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {featureHighlights.map((feature) => (
              <div
                key={feature.label}
                className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300"
              >
                <span className="text-orange-600 dark:text-orange-300">
                  {feature.icon}
                </span>
                {feature.label}
              </div>
            ))}
          </div>
        </section>

        <SiteFooter footerConverters={footerConverters} />
      </div>
    </div>
  );
}
