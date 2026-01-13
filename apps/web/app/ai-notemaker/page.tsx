import { AdSlot } from "../components/ad-slot";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { converters, footerConverters } from "../lib/converters";
import { getUserPlan } from "../lib/plans";

const howItWorks = [
  {
    title: "Paste your text",
    description: "Drop in long paragraphs, transcripts, or reports.",
  },
  {
    title: "Generate notes",
    description: "Create summaries, bullet points, and action items.",
  },
  {
    title: "Export and share",
    description: "Copy, download, or keep refining your notes.",
  },
];

export default async function AiNoteMakerPage() {
  const plan = await getUserPlan();
  const showAds = plan === "free";

  return (
    <div className="relative min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <SiteHeader converters={converters} />

        <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-none">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-300">
              AI NoteMaker
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Turn long text into clear notes
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Summarize paragraphs, transcripts, and reports into bullet points
              and action items.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-none">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Your text
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Paste or type
                </span>
              </div>
              <textarea
                className="mt-3 h-40 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus-visible:border-[var(--brand-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:placeholder:text-zinc-500"
                placeholder="Paste long text here..."
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Suggested length: 300 to 3000 words.
                </span>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-[var(--brand-500)] px-4 py-2 text-xs font-semibold text-[var(--brand-on)] shadow-sm shadow-black/20 transition hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:shadow-black/40 dark:focus-visible:ring-offset-zinc-950"
                >
                  Generate notes
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-none">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Notes preview
              </div>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-zinc-700 dark:bg-zinc-300" />
                  Highlight the most important points in seconds.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-zinc-700 dark:bg-zinc-300" />
                  Turn dense paragraphs into scannable bullets.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-zinc-700 dark:bg-zinc-300" />
                  Capture action items without losing context.
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
                  Summary
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
                  Key points
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
                  Action items
                </span>
              </div>
            </div>
          </div>
        </section>

        {showAds ? <AdSlot label="Advertisement slot" /> : null}

        <section className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">How it works</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                A fast workflow from raw text to clean notes.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {howItWorks.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 transition hover:border-zinc-300 hover:bg-zinc-50/70 dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-none dark:hover:border-zinc-600 dark:hover:bg-zinc-900/60"
              >
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {step.title}
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {showAds ? <AdSlot label="Advertisement slot" /> : null}

        <SiteFooter footerConverters={footerConverters} />
      </div>
    </div>
  );
}
