import { FileChip } from "@repo/ui/file-chip";
import type { Converter } from "../lib/converters";
import {
  converters,
  footerConverters,
  getConverterAccept,
  getConverterFormats,
  getConverterPrimaryInput,
} from "../lib/converters";
import { getCurrentLanguage } from "../lib/i18n";
import { getTranslator } from "../lib/translations";
import { AdSlot } from "./ad-slot";
import { ConverterWorkflow } from "./converter-workflow";
import { MobileRectangleAds } from "./mobile-rectangle-ads";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { ConverterGrid } from "../../src/components/ConverterGrid";

export async function ConverterPage({ converter }: { converter: Converter }) {
  const lang = await getCurrentLanguage();
  const t = getTranslator(lang);
  const formats = getConverterFormats(converter);
  const outputLabel = converter.outputFormat.toUpperCase();
  const inputLabel = getConverterPrimaryInput(converter).toUpperCase();
  const uploadLabel =
    converter.slug === "image-to-text" ? "image" : inputLabel;
  const accept = getConverterAccept(converter);
  const howItWorks = [
    {
      title: t("converterPage.steps.drop.title"),
      description: t("converterPage.steps.drop.description"),
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
      title: t("converterPage.steps.convert.title"),
      description: t("converterPage.steps.convert.description", {
        outputLabel,
      }),
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
      title: t("converterPage.steps.download.title"),
      description: t("converterPage.steps.download.description"),
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
  const featureHighlights = [
    {
      label: t("converterPage.features.free"),
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
      label: t("converterPage.features.ai"),
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
      label: t("converterPage.features.languages"),
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
  const showAds = true;
  const formatLine =
    converter.slug === "image-to-text"
      ? t("converterPage.supportedFormatsPlural", {
          formats: formats.join(", "),
        })
      : t("converterPage.supportedFormatsSingle", {
          formats: formats.join(", "),
        });

  return (
    <div className="relative min-h-screen bg-white text-zinc-900 dark:bg-[var(--background)] dark:text-[var(--foreground)]">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <SiteHeader converters={converters} currentSlug={converter.slug} />

        <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600 dark:text-[var(--muted)]">
              {converter.title}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {converter.title} {t("converterPage.titleSuffix")}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-[var(--muted)]">
              {converter.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
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

        {showAds ? (
          <AdSlot label={t("ads.label")} text={t("ads.text")} />
        ) : null}

        <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">
                {t("converterPage.howItWorks.title")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
                {t("converterPage.howItWorks.description")}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {howItWorks.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 transition hover:border-zinc-300 hover:bg-zinc-50/70 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none dark:hover:border-[var(--border-2)] dark:hover:bg-[var(--surface-3)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-[var(--surface-3)] dark:text-[var(--muted)]">
                    {step.icon}
                  </div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                    {step.title}
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-600 dark:text-[var(--muted)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {featureHighlights.map((feature) => (
              <div
                key={feature.label}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)]"
              >
                <span className="text-zinc-600 dark:text-[var(--muted)]">
                  {feature.icon}
                </span>
                {feature.label}
              </div>
            ))}
          </div>
        </section>

        <MobileRectangleAds label={t("ads.label")} text={t("ads.text")} />

        <ConverterGrid
          converters={converters}
          currentSlug={converter.slug}
          heading={t("grid.title")}
          description={t("grid.description")}
        />

        {showAds ? (
          <AdSlot label={t("ads.label")} text={t("ads.text")} />
        ) : null}

        <SiteFooter footerConverters={footerConverters} />
      </div>
    </div>
  );
}
