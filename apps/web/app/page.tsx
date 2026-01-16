import { FileChip } from "@repo/ui/file-chip";
import { AdSlot } from "../src/components/AdSlot";
import { ConverterGrid } from "../src/components/ConverterGrid";
import {
  converters,
  footerConverters,
  getConverterAccept,
  getConverterBySlug,
  getConverterFormats,
  getConverterPrimaryInput,
} from "../src/lib/converters";
import { ConverterWorkflow } from "./components/converter-workflow";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import { getUserPlan } from "./lib/plans";

const howItWorksSteps = [
  {
    title: "Upload your file",
    description: "Drop or browse to select your document or image.",
  },
  {
    title: "Convert instantly",
    description: "We extract and convert with AI-powered processing.",
  },
  {
    title: "Download results",
    description: "Save or share your converted file immediately.",
  },
];

export default async function Home() {
  const converter = getConverterBySlug("image-to-text");
  if (!converter) {
    return null;
  }

  const formats = getConverterFormats(converter);
  const accept = getConverterAccept(converter);
  const uploadLabel = "image";
  const formatLine = `Supported formats: ${formats.join(", ")} and more.`;
  const plan = await getUserPlan();
  const showAds = plan === "free";

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
                {converter.title} Converter
              </h1>
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
        </div>

        {showAds ? (
          <AdSlot plan={plan} slot="home-inline" className="min-h-[140px]" />
        ) : null}

        <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">How it works</h2>
              <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
                Convert files in minutes with a simple flow.
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
                  Step {index + 1}
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

        <ConverterGrid converters={converters} currentSlug={converter.slug} />

        <SiteFooter footerConverters={footerConverters} />
      </div>
    </div>
  );
}
