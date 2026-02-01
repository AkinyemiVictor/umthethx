import { AdSlot } from "../components/ad-slot";
import { MobileRectangleAds } from "../components/mobile-rectangle-ads";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { converters, footerConverters } from "../lib/converters";
import { getCurrentLanguage } from "../lib/i18n";
import { getTranslator } from "../lib/translations";

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
    <div className="relative min-h-screen bg-white text-zinc-900 dark:bg-[var(--background)] dark:text-[var(--foreground)]">
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

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                  {t("aiNoteMaker.inputLabel")}
                </div>
                <span className="text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                  {t("aiNoteMaker.inputHint")}
                </span>
              </div>
              <textarea
                className="mt-3 h-40 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus-visible:border-[var(--brand-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)] dark:placeholder:text-[var(--muted-2)]"
                placeholder={t("aiNoteMaker.inputPlaceholder")}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                  {t("aiNoteMaker.suggestedLength")}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-[var(--brand-500)] px-4 py-2 text-xs font-semibold text-[var(--brand-on)] shadow-sm shadow-black/20 transition hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:shadow-black/40 dark:focus-visible:ring-offset-[var(--background)]"
                >
                  {t("aiNoteMaker.generate")}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none">
              <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                {t("aiNoteMaker.previewTitle")}
              </div>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-[var(--muted)]">
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-zinc-700 dark:bg-[var(--muted)]" />
                  {t("aiNoteMaker.previewBullet1")}
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-zinc-700 dark:bg-[var(--muted)]" />
                  {t("aiNoteMaker.previewBullet2")}
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-zinc-700 dark:bg-[var(--muted)]" />
                  {t("aiNoteMaker.previewBullet3")}
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)]">
                  {t("aiNoteMaker.previewTagSummary")}
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)]">
                  {t("aiNoteMaker.previewTagKeyPoints")}
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)]">
                  {t("aiNoteMaker.previewTagActionItems")}
                </span>
              </div>
            </div>
          </div>
        </section>

        <MobileRectangleAds label={t("ads.label")} text={t("ads.text")} />

        <AdSlot label={t("ads.label")} text={t("ads.text")} />

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

        <AdSlot label={t("ads.label")} text={t("ads.text")} />

        <SiteFooter footerConverters={footerConverters} />
      </div>
    </div>
  );
}
