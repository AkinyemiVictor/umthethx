import Image from "next/image";
import Link from "next/link";
import { FileChip } from "@repo/ui/file-chip";
import type { Converter } from "../lib/converters";
import { getConverterHref } from "../lib/converters";

type SiteHeaderProps = {
  converters: Converter[];
  currentSlug?: string;
};

export function SiteHeader({ converters, currentSlug }: SiteHeaderProps) {
  const toggleId = "converter-toggle";

  return (
    <div className="flex flex-col gap-4">
      <input
        id={toggleId}
        type="checkbox"
        className="peer sr-only"
        aria-controls="converter-panel"
        aria-label="Toggle converters list"
      />
      <label
        htmlFor={toggleId}
        aria-hidden="true"
        tabIndex={-1}
        className="fixed inset-0 z-10 hidden cursor-default peer-checked:block"
      />
      <header className="flex flex-wrap items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo/Artboard 1.png"
            alt="Untetx logo"
            width={140}
            height={44}
            priority
          />
          <span className="sr-only">Untetx</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          <label
            htmlFor={toggleId}
            className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-orange-200 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10 dark:focus-visible:ring-offset-zinc-950"
          >
            Converters
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-4 w-4 text-orange-500"
            >
              <path
                d="M5 7.5 10 12.5 15 7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </label>
        </nav>
      </header>

      <div
        id="converter-panel"
        className="relative z-20 mt-0 max-h-0 w-full overflow-hidden rounded-3xl border border-transparent bg-white/90 p-0 opacity-0 shadow-sm shadow-orange-100/80 backdrop-blur transition-all duration-300 ease-out peer-checked:max-h-[460px] peer-checked:border-orange-100 peer-checked:p-4 peer-checked:opacity-100 dark:bg-zinc-950/90 dark:shadow-none dark:peer-checked:border-orange-500/20"
      >
        <div className="max-h-[360px] overflow-y-auto pr-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {converters.map((converter) => {
              const isActive = converter.slug === currentSlug;
              return (
                <Link
                  key={converter.title}
                  href={getConverterHref(converter)}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "rounded-2xl border p-3 transition",
                    "border-zinc-200 bg-white/80 hover:border-orange-200 hover:bg-orange-50",
                    "dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10",
                    isActive
                      ? "border-orange-300 bg-orange-50 dark:border-orange-400/40 dark:bg-orange-500/10"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {converter.title}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <FileChip ext={converter.from} />
                    <span className="text-zinc-400">-&gt;</span>
                    <FileChip ext={converter.to} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Scroll to view more converters.
        </div>
      </div>
    </div>
  );
}
