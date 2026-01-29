import { ConverterGrid } from "../src/components/ConverterGrid";
import {
  converters,
  footerConverters,
  getConverterAccept,
  getConverterBySlug,
  getConverterFormats,
} from "../src/lib/converters";
import { ConverterWorkflow } from "./components/converter-workflow";
import { AdSlot } from "./components/ad-slot";
import { MobileRectangleAds } from "./components/mobile-rectangle-ads";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import { getCurrentLanguage } from "./lib/i18n";
import { getTranslator } from "./lib/translations";

export default async function Home() {
  const converter = getConverterBySlug("image-to-text");
  if (!converter) {
    return null;
  }
  const lang = await getCurrentLanguage();
  const t = getTranslator(lang);

  const formats = getConverterFormats(converter);
  const accept = getConverterAccept(converter);
  const uploadLabel = "image";
  const formatLine = t("converterPage.supportedFormatsPlural", {
    formats: formats.join(", "),
  });
  const showAds = true;
  const howItWorksSteps = [
    {
      title: t("home.steps.upload.title"),
      description: t("home.steps.upload.description"),
    },
    {
      title: t("home.steps.convert.title"),
      description: t("home.steps.convert.description"),
    },
    {
      title: t("home.steps.download.title"),
      description: t("home.steps.download.description"),
    },
  ];
  return (
    <div className="relative min-h-screen bg-white text-zinc-900 dark:bg-[var(--background)] dark:text-[var(--foreground)]">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <SiteHeader converters={converters} currentSlug={converter.slug} />

        <div className="grid gap-6">
          <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600 dark:text-[var(--muted)]">
                {converter.title}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {converter.title} {t("converterPage.titleSuffix")}
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-[var(--muted)]">
                {converter.description}
              </p>
            </div>
            <ConverterWorkflow
              converter={converter}
              accept={accept}
              uploadLabel={uploadLabel}
              formatLine={formatLine}
            />
          </section>
        </div>

        {showAds ? (
          <AdSlot slot="home-inline" className="min-h-[140px]">
            {t("ads.text")}
          </AdSlot>
        ) : null}

        <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">
                {t("home.howItWorks.title")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
                {t("home.howItWorks.description")}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {howItWorksSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--muted)] dark:shadow-none"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  {t("common.stepLabel", { number: index + 1 })}
                </div>
                <div className="mt-2 text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                  {step.title}
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-[var(--muted)]">
                  {step.description}
                </p>
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
          <AdSlot slot="home-footer" className="min-h-[140px]">
            {t("ads.text")}
          </AdSlot>
        ) : null}

        <SiteFooter footerConverters={footerConverters} />
      </div>
    </div>
  );
}
