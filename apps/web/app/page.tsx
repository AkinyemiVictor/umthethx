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
import { HowItWorksSection } from "./components/how-it-works-section";
import { getCurrentLanguage } from "./lib/i18n";
import {
  buildMetadata,
  createFaqStructuredData,
  createSoftwareApplicationStructuredData,
  getConverterBenefits,
  getConverterFaqs,
  getConverterHeroDescription,
  getConverterIntroParagraphs,
  getConverterMetadata,
  getConverterSearchIntentLines,
  getConverterSeoKeywords,
} from "./lib/seo";
import { getTranslator } from "./lib/translations";

const homeConverter = getConverterBySlug("image-to-text");

export const metadata = homeConverter
  ? getConverterMetadata(homeConverter)
  : buildMetadata({
      title: "Image to Text Converter",
      description:
        "Free image to text converter online. Upload image files and extract editable text in your browser.",
      path: "/",
      keywords: ["image to text", "online ocr", "image to text converter"],
    });

export default async function Home() {
  const converter = homeConverter;
  if (!converter) {
    return null;
  }
  const lang = await getCurrentLanguage();
  const t = getTranslator(lang);

  const formats = getConverterFormats(converter);
  const accept = getConverterAccept(converter);
  const uploadLabel = "image";
  const heroDescription = getConverterHeroDescription(converter);
  const introParagraphs = getConverterIntroParagraphs(converter);
  const benefitHighlights = getConverterBenefits(converter);
  const faqs = getConverterFaqs(converter);
  const searchIntentLines = getConverterSearchIntentLines(converter);
  const formatLine = t("converterPage.supportedFormatsPlural", {
    formats: formats.join(", "),
  });
  const showAds = true;
  const howItWorksSteps = [
    {
      label: t("common.stepLabel", { number: 1 }),
      title: t("home.steps.upload.title"),
      description: t("home.steps.upload.description"),
    },
    {
      label: t("common.stepLabel", { number: 2 }),
      title: t("home.steps.convert.title"),
      description: t("home.steps.convert.description"),
    },
    {
      label: t("common.stepLabel", { number: 3 }),
      title: t("home.steps.download.title"),
      description: t("home.steps.download.description"),
    },
  ];

  const structuredData = [
    createSoftwareApplicationStructuredData({
      name: `${converter.title} Converter`,
      path: "/",
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
          key={`home-structured-data-${index}`}
          type="application/ld+json"
        />
      ))}

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <SiteHeader converters={converters} currentSlug={converter.slug} />

        <div className="grid gap-6">
          <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
            <div className="text-center">
              <div className="sr-only">
                <h1>Free {converter.title} Converter Online</h1>
                <p>{heroDescription}</p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600 dark:text-[var(--muted)]">
                {converter.title}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                {converter.title} {t("converterPage.titleSuffix")}
              </h2>
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
          <AdSlot
            slot="home-inline"
            className="min-h-[140px]"
            label={t("ads.label")}
          >
            {t("ads.text")}
          </AdSlot>
        ) : null}

        <HowItWorksSection
          title={t("home.howItWorks.title")}
          description={t("home.howItWorks.description")}
          steps={howItWorksSteps}
        />

        <section className="sr-only">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              About the {converter.title} tool
            </h2>
            <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
              This page now includes image-to-text specific content so the home
              route is clearer for both users and search engines.
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
                className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none"
              >
                <h3 className="font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                  {benefit}
                </h3>
              </article>
            ))}
          </div>
        </section>

        <MobileRectangleAds label={t("ads.label")} text={t("ads.text")} />

        <section className="sr-only">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              Frequently asked questions about {converter.title}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
              These answers add more image-to-text specific context to the home
              page.
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
        />

        {showAds ? (
          <AdSlot
            slot="home-footer"
            className="min-h-[140px]"
            label={t("ads.label")}
          >
            {t("ads.text")}
          </AdSlot>
        ) : null}

        <SiteFooter footerConverters={footerConverters} />
      </div>
    </div>
  );
}
