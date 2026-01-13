import Link from "next/link";
import { FileChip } from "@repo/ui/file-chip";
import type { Converter } from "../lib/converters";
import {
  converters,
  footerConverters,
  getConverterAccept,
  getConverterCategoryGroups,
  getConverterFormats,
  getConverterHref,
  getConverterPrimaryInput,
} from "../lib/converters";
import { getUserPlan } from "../lib/plans";
import { AdSlot } from "./ad-slot";
import { ConverterCategoryIcon } from "./converter-category-icon";
import { ConverterWorkflow } from "./converter-workflow";
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

export async function ConverterPage({ converter }: { converter: Converter }) {
  const formats = getConverterFormats(converter);
  const outputLabel = converter.outputFormat.toUpperCase();
  const inputLabel = getConverterPrimaryInput(converter).toUpperCase();
  const uploadLabel =
    converter.slug === "image-to-text" ? "image" : inputLabel;
  const accept = getConverterAccept(converter);
  const howItWorks = buildHowItWorks(outputLabel);
  const converterGroups = getConverterCategoryGroups(converters);
  const plan = await getUserPlan();
  const showAds = plan === "free";
  const formatLine =
    converter.slug === "image-to-text"
      ? `Supported formats: ${formats.join(", ")} and more.`
      : `Supported format: ${formats.join(", ")}.`;

  return (
    <div className="relative min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <SiteHeader converters={converters} currentSlug={converter.slug} />

        <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-none">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-300">
              {converter.title}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {converter.title} Converter
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {converter.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <FileChip ext={getConverterPrimaryInput(converter)} />
              <span className="text-zinc-400">-&gt;</span>
              <FileChip ext={converter.outputFormat} />
            </div>
          </div>
          <ConverterWorkflow
            converter={converter}
            accept={accept}
            uploadLabel={uploadLabel}
            formatLine={formatLine}
          />
        </section>

        {showAds ? <AdSlot label="Advertisement slot" /> : null}

        <section
          id="converters"
          className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-none"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Converters</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Switch to another converter in one click.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {converterGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-2xl border border-zinc-300 bg-white/95 p-4 shadow-sm shadow-black/10 dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-none"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <ConverterCategoryIcon
                      name={group.icon}
                      className="h-4 w-4 text-[var(--brand-500)]"
                    />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {group.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {group.description}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {group.items.map((item) => {
                    const isActive = item.slug === converter.slug;
                    return (
                      <Link
                        key={item.slug}
                        href={getConverterHref(item)}
                        aria-current={isActive ? "page" : undefined}
                        className={[
                          "rounded-xl border p-3 transition",
                          "border-zinc-200 bg-white hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)]",
                          "dark:border-zinc-800 dark:bg-zinc-950",
                          isActive
                            ? "border-[var(--brand-500)] bg-[var(--brand-50)]"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                          {item.title}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                          <FileChip ext={getConverterPrimaryInput(item)} />
                          <span className="text-zinc-400">-&gt;</span>
                          <FileChip ext={item.outputFormat} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {showAds ? <AdSlot label="Advertisement slot" /> : null}

        <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">How it works</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Simple steps to move from source files to finished results.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {howItWorks.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 transition hover:border-zinc-300 hover:bg-zinc-50/70 dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-none dark:hover:border-zinc-600 dark:hover:bg-zinc-900/60"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
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
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200"
              >
                <span className="text-zinc-600 dark:text-zinc-300">
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
