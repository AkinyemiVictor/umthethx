"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileConvertersOpen, setIsMobileConvertersOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const toggleMobileConverters = () =>
    setIsMobileConvertersOpen((prev) => !prev);
  const toggleMobileGroup = (title: string) =>
    setOpenMobileGroup((prev) => (prev === title ? null : title));

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
        <div className="flex items-center gap-2 sm:gap-6">
          <ThemeToggle />
          <nav className="hidden items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-[var(--muted)] min-[740px]:flex min-[740px]:gap-6 min-[740px]:text-sm">
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
          </nav>
          <button
            type="button"
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
            onClick={toggleMobileMenu}
            className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white p-2 text-zinc-700 transition hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--foreground)] dark:focus-visible:ring-offset-[var(--background)] min-[740px]:hidden"
          >
            <span className="sr-only">{t("header.toggleMenu")}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {isMobileMenuOpen ? (
        <button
          type="button"
          aria-hidden="true"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm min-[740px]:hidden"
        />
      ) : null}

      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-hidden={!isMobileMenuOpen}
        className={[
          "fixed inset-y-0 right-0 z-[100] w-72 max-w-[85vw] border-l border-zinc-200 bg-white/95 shadow-xl shadow-black/20 backdrop-blur transition-transform duration-300 ease-out dark:border-[var(--border-2)] dark:bg-[var(--surface-1)]",
          isMobileMenuOpen
            ? "translate-x-0"
            : "translate-x-full pointer-events-none",
          "min-[740px]:hidden",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-[var(--border-2)]">
          <span className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
            Umthethx
          </span>
          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label={t("header.toggleMenu")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-[var(--border-2)] dark:text-[var(--foreground)]"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-2 px-4 py-4 text-sm font-semibold text-zinc-700 dark:text-[var(--foreground)]">
          <button
            type="button"
            onClick={toggleMobileConverters}
            aria-expanded={isMobileConvertersOpen}
            className="inline-flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--foreground)] dark:focus-visible:ring-offset-[var(--background)]"
          >
            <span>{t("header.converters")}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className={[
                "h-4 w-4 text-zinc-500 transition dark:text-[var(--muted-2)]",
                isMobileConvertersOpen ? "rotate-180" : "",
              ]
                .filter(Boolean)
                .join(" ")}
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
          </button>
          {isMobileConvertersOpen ? (
            <div className="rounded-2xl border border-zinc-200 bg-white/80 p-2 text-xs text-zinc-700 shadow-sm shadow-black/5 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--foreground)]">
              <div className="flex flex-col gap-1">
                {converterGroups.map((group) => {
                  const isOpen = openMobileGroup === group.title;
                  return (
                    <div key={group.title}>
                      <button
                        type="button"
                        onClick={() => toggleMobileGroup(group.title)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-zinc-800 transition hover:bg-[var(--brand-50)] dark:text-[var(--foreground)]"
                      >
                        <span>{group.title}</span>
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 20 20"
                          className={[
                            "h-4 w-4 text-zinc-500 transition dark:text-[var(--muted-2)]",
                            isOpen ? "rotate-180" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
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
                      </button>
                      {isOpen ? (
                        <div className="mt-1 space-y-1 rounded-xl bg-white px-3 py-2 dark:bg-[var(--surface-3)]">
                          {group.items.map((converter) => (
                            <Link
                              key={converter.slug}
                              href={getConverterHref(converter)}
                              onClick={closeMobileMenu}
                              className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs text-zinc-600 transition hover:bg-[var(--brand-50)] hover:text-zinc-900 dark:text-[var(--muted)] dark:hover:text-[var(--foreground)]"
                            >
                              <span className="truncate">
                                {converter.title}
                              </span>
                              <span className="ml-2 text-[10px] text-zinc-400">
                                {converter.outputFormat.toUpperCase()}
                              </span>
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          <Link
            href="/ai-notemaker"
            onClick={closeMobileMenu}
            className="inline-flex items-center rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--foreground)] dark:focus-visible:ring-offset-[var(--background)]"
          >
            {t("header.aiNoteMaker")}
          </Link>
        </div>
      </div>

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
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
