import { AdSlot } from "../components/ad-slot";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { TranslatorWorkflow } from "../components/translator-workflow";
import { converters, footerConverters } from "../lib/converters";
import { getCurrentLanguage } from "../lib/i18n";
import { getTranslator } from "../lib/translations";

export default async function TranslatorPage() {
  const lang = await getCurrentLanguage();
  const t = getTranslator(lang);
  const steps = [
    {
      title: t("translator.steps.choose.title"),
      description: t("translator.steps.choose.description"),
    },
    {
      title: t("translator.steps.translate.title"),
      description: t("translator.steps.translate.description"),
    },
    {
      title: t("translator.steps.copy.title"),
      description: t("translator.steps.copy.description"),
    },
  ];

  return (
    <div className="relative min-h-screen bg-white text-zinc-900 dark:bg-[var(--background)] dark:text-[var(--foreground)]">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <SiteHeader converters={converters} />

        <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600 dark:text-[var(--muted)]">
              {t("translator.heroTag")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {t("translator.title")}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-[var(--muted)]">
              {t("translator.subtitle")}
            </p>
          </div>

          <TranslatorWorkflow />
        </section>

        <AdSlot label={t("ads.label")} text={t("ads.text")} />

        <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">
                {t("translator.howItWorks.title")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
                {t("translator.howItWorks.description")}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {steps.map((step) => (
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
