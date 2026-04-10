import Link from "next/link";
import { FileChip } from "@repo/ui/file-chip";
import type { Converter } from "../lib/converters";
import {
  converters,
  footerConverters,
  getConverterAccept,
  getConverterFormats,
  getConverterHref,
  getConverterPrimaryInput,
} from "../lib/converters";
import { getCurrentLanguage } from "../lib/i18n";
import { getCurrentMarket, prefixMarketPath } from "../lib/markets";
import {
  createBreadcrumbStructuredData,
  createFaqStructuredData,
  createSoftwareApplicationStructuredData,
  getConverterBenefits,
  getConverterFaqs,
  getConverterHeroDescription,
  getConverterIntroParagraphs,
  getRelatedConverters,
  getConverterSearchIntentLines,
  getConverterSeoKeywords,
} from "../lib/seo";
import { getTranslator } from "../lib/translations";
import { AdSlot } from "./ad-slot";
import { ConverterWorkflow } from "./converter-workflow";
import { HowItWorksSection } from "./how-it-works-section";
import { MobileRectangleAds } from "./mobile-rectangle-ads";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { ConverterGrid } from "../../src/components/ConverterGrid";

export async function ConverterPage({ converter }: { converter: Converter }) {
  const lang = await getCurrentLanguage();
  const market = await getCurrentMarket();
  const t = getTranslator(lang);
  const formats = getConverterFormats(converter);
  const primaryInput = getConverterPrimaryInput(converter);
  const outputLabel = converter.outputFormat.toUpperCase();
  const inputLabel = primaryInput.toUpperCase();
  const uploadLabel = primaryInput === "image" ? "image" : inputLabel;
  const accept = getConverterAccept(converter);
  const heroDescription = getConverterHeroDescription(converter);
  const introParagraphs = getConverterIntroParagraphs(converter);
  const benefitHighlights = getConverterBenefits(converter);
  const faqs = getConverterFaqs(converter);
  const relatedConverters = getRelatedConverters(converter);
  const searchIntentLines = getConverterSearchIntentLines(converter);
  const howItWorks = [
    {
      label: t("common.stepLabel", { number: 1 }),
      title: t("converterPage.steps.drop.title"),
      description: t("converterPage.steps.drop.description"),
    },
    {
      label: t("common.stepLabel", { number: 2 }),
      title: t("converterPage.steps.convert.title"),
      description: t("converterPage.steps.convert.description", {
        outputLabel,
      }),
    },
    {
      label: t("common.stepLabel", { number: 3 }),
      title: t("converterPage.steps.download.title"),
      description: t("converterPage.steps.download.description"),
    },
  ];
  const showAds = true;
  const formatLine =
    converter.accept.extensions.length > 1
      ? t("converterPage.supportedFormatsPlural", {
          formats: formats.join(", "),
        })
      : t("converterPage.supportedFormatsSingle", {
          formats: formats.join(", "),
        });

  const structuredData = [
    createBreadcrumbStructuredData([
      { name: "Home", path: prefixMarketPath("/ocr", market) },
      { name: converter.title, path: getConverterHref(converter, market) },
    ]),
    createSoftwareApplicationStructuredData({
      name: `${converter.title} Converter`,
      path: getConverterHref(converter, market),
      description: heroDescription,
      featureList: benefitHighlights,
      keywords: getConverterSeoKeywords(converter),
    }),
    createFaqStructuredData(faqs),
  ];

  return (
    <div className="relative min-h-[100svh] bg-white text-zinc-900 dark:bg-[var(--background)] dark:text-[var(--foreground)]">
      {structuredData.map((data, index) => (
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          key={`${converter.slug}-structured-data-${index}`}
          type="application/ld+json"
        />
      ))}

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <SiteHeader converters={converters} currentSlug={converter.slug} />

        <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
          <div className="text-center">
            <div className="sr-only">
              <h1>Free {converter.title} Converter Online</h1>
              <p>{heroDescription}</p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600 dark:text-[var(--muted)]">
              {converter.title}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
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
          <AdSlot
            label={t("ads.label")}
            text={t("ads.text")}
            slot="converter-inline"
          />
        ) : null}

        <HowItWorksSection
          title={t("converterPage.howItWorks.title")}
          description={t("converterPage.howItWorks.description")}
          steps={howItWorks}
        />

        <section className="sr-only">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              About the {converter.title} tool
            </h2>
            <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
              This page now includes converter-specific content so search
              engines can understand the exact task this tool handles.
            </p>
          </div>

          <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-700 dark:text-[var(--muted)]">
            {introParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {searchIntentLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {benefitHighlights.map((benefit) => (
              <article
                key={benefit}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none"
              >
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                  {benefit}
                </h3>
              </article>
            ))}
          </div>

          {relatedConverters.length ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                Related converters
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {relatedConverters.map((item) => (
                  <Link
                    key={item.slug}
                    href={getConverterHref(item, market)}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--foreground)]"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <MobileRectangleAds label={t("ads.label")} text={t("ads.text")} />

        <section className="sr-only">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              Frequently asked questions about {converter.title}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
              These answers give each converter page more useful search-facing
              context beyond the upload form.
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none"
              >
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-[var(--muted)]">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </section>

        <ConverterGrid
          converters={converters}
          currentSlug={converter.slug}
          heading={t("grid.title")}
          description={t("grid.description")}
          market={market}
        />

        {showAds ? (
          <AdSlot
            label={t("ads.label")}
            text={t("ads.text")}
            slot="converter-footer"
          />
        ) : null}

        <SiteFooter footerConverters={footerConverters} />
      </div>
    </div>
  );
}
