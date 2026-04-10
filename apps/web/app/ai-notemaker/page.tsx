import type { Metadata } from "next";
import { AdSlot } from "../components/ad-slot";
import { MobileRectangleAds } from "../components/mobile-rectangle-ads";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { AiNoteMakerWorkspace } from "../components/ai-note-maker";
import { AiNoteMakerTypeGrid } from "../components/ai-note-maker-type-grid";
import { converters, footerConverters } from "../lib/converters";
import { getCurrentLanguage } from "../lib/i18n";
import { getCurrentMarket, prefixMarketPath } from "../lib/markets";
import { buildMetadata } from "../lib/seo";
import { getTranslator } from "../lib/translations";

export async function generateMetadata(): Promise<Metadata> {
  const market = await getCurrentMarket();

  return buildMetadata({
    title: "AI NoteMaker",
    description:
      "AI NoteMaker online. Turn PDFs, DOCX files, transcripts, and long text into clear notes, summaries, and action items.",
    path: prefixMarketPath("/ai-notemaker", market),
    keywords: [
      "ai note maker",
      "notes from pdf",
      "summarize document online",
      "ai notes generator",
    ],
  });
}

export default async function AiNoteMakerPage() {
  const lang = await getCurrentLanguage();
  const t = getTranslator(lang);
  const howItWorks = [
    {
      title: t("aiNoteMaker.steps.paste.title"),
      description: t("aiNoteMaker.steps.paste.description"),
    },
    {
      title: t("aiNoteMaker.steps.generate.title"),
      description: t("aiNoteMaker.steps.generate.description"),
    },
    {
      title: t("aiNoteMaker.steps.export.title"),
      description: t("aiNoteMaker.steps.export.description"),
    },
  ];

  return (
    <div className="relative min-h-[100svh] bg-white text-zinc-900 dark:bg-[var(--background)] dark:text-[var(--foreground)]">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <SiteHeader converters={converters} />

        <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600 dark:text-[var(--muted)]">
              {t("aiNoteMaker.heroTag")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {t("aiNoteMaker.title")}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-[var(--muted)]">
              {t("aiNoteMaker.subtitle")}
            </p>
          </div>

          <AiNoteMakerWorkspace />
        </section>

        <AdSlot
          label={t("ads.label")}
          text={t("ads.text")}
          slot="ai-notemaker-inline"
        />

        <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">
                {t("aiNoteMaker.howItWorks.title")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
                {t("aiNoteMaker.howItWorks.description")}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {howItWorks.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 transition hover:border-zinc-300 hover:bg-zinc-50/70 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none dark:hover:border-[var(--border-2)] dark:hover:bg-[var(--surface-3)]"
              >
                <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
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

        <AiNoteMakerTypeGrid />

        <AdSlot
          label={t("ads.label")}
          text={t("ads.text")}
          slot="ai-notemaker-footer"
        />

        <SiteFooter footerConverters={footerConverters} />
      </div>
    </div>
  );
}
