"use client";

import Image from "next/image";
import Link from "next/link";
import { FileChip } from "@repo/ui/file-chip";
import type { Converter } from "../lib/converters";
import { ConverterCategoryIcon } from "./converter-category-icon";
import { ThemeToggle } from "./theme-toggle";
import { useTranslations } from "./language-provider";
import {
  getConverterCategoryGroups,
  getConverterHref,
  getConverterPrimaryInput,
} from "../lib/converters";

type SiteHeaderProps = {
  converters: Converter[];
  currentSlug?: string;
};

export function SiteHeader({ converters, currentSlug }: SiteHeaderProps) {
  const toggleId = "converter-toggle";
  const converterGroups = getConverterCategoryGroups(converters);
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-4">
      <input
        id={toggleId}
        type="checkbox"
        className="peer sr-only"
        aria-controls="converter-panel"
        aria-label={t("header.toggleConvertersList")}
      />
      <label
        htmlFor={toggleId}
        aria-hidden="true"
        tabIndex={-1}
        className="fixed inset-0 z-10 hidden cursor-default peer-checked:block"
      />
      <header className="flex items-center justify-between gap-3 sm:gap-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo/logo.png"
            alt="Umthethx logo"
            width={140}
            height={44}
            className="h-4 w-auto sm:h-6"
            priority
          />
          <span className="sr-only">Umthethx</span>
        </Link>
        <nav className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-[var(--muted)] sm:gap-6 sm:text-sm">
          <ThemeToggle />
          <label
            htmlFor={toggleId}
            className="inline-flex cursor-pointer list-none items-center gap-2 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--foreground)] dark:focus-visible:ring-offset-[var(--background)] sm:px-4 sm:py-2 sm:text-sm"
          >
            {t("header.converters")}
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-4 w-4 text-zinc-500 dark:text-[var(--muted-2)]"
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
          <Link
            href="/ai-notemaker"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--foreground)] dark:focus-visible:ring-offset-[var(--background)] sm:px-4 sm:py-2 sm:text-sm"
          >
            {t("header.aiNoteMaker")}
          </Link>
          <Link
            href="/translator"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--foreground)] dark:focus-visible:ring-offset-[var(--background)] sm:px-4 sm:py-2 sm:text-sm"
          >
            {t("header.translator")}
          </Link>
        </nav>
      </header>

      <div
        id="converter-panel"
        className="relative z-20 mt-0 max-h-0 w-full overflow-hidden rounded-3xl border border-transparent bg-white/95 p-0 opacity-0 shadow-md shadow-black/10 backdrop-blur transition-all duration-300 ease-out peer-checked:max-h-[360px] peer-checked:border-zinc-300 peer-checked:p-4 peer-checked:opacity-100 dark:bg-[var(--surface-1)] dark:shadow-none dark:peer-checked:border-[var(--border-1)]"
      >
        <div className="max-h-[288px] overflow-y-auto pr-2">
          <div className="space-y-5">
            {converterGroups.map((group) => (
              <div key={group.title}>
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-[var(--muted-2)]">
                  <ConverterCategoryIcon
                    name={group.icon}
                    className="h-6 w-6 text-slate-700 dark:text-slate-100"
                  />
                  <span>{group.title}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                  {group.description}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
                  {group.items.map((converter) => {
                    const isActive = converter.slug === currentSlug;
                    return (
                      <Link
                        key={converter.slug}
                        href={getConverterHref(converter)}
                        aria-current={isActive ? "page" : undefined}
                        className={[
                          "flex min-h-[72px] flex-col justify-between rounded-2xl border p-3 shadow-sm shadow-black/10 transition",
                          "border-zinc-200 bg-white hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)]",
                          "dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none",
                          isActive
                            ? "border-[var(--brand-500)] bg-[var(--brand-50)]"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <div className="truncate text-xs font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                          {converter.title}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-[var(--muted-2)]">
                          <FileChip ext={getConverterPrimaryInput(converter)} />
                          <span className="text-zinc-400">-&gt;</span>
                          <FileChip ext={converter.outputFormat} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 text-center text-xs text-zinc-500 dark:text-[var(--muted-2)]">
          {t("header.scrollMore")}
        </div>
      </div>
    </div>
  );
}
