"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FileChip } from "@repo/ui/file-chip";
import type { Converter } from "../lib/converters";
import { ConverterCategoryIcon } from "./converter-category-icon";
import { ThemeToggle } from "./theme-toggle";
import { useTranslations } from "./language-provider";
import {
  noteMakerGroups,
  normalizeMode,
  type NoteMakerMode,
} from "../lib/ai-notemaker-types";
import { NoteMakerCategoryIcon } from "./note-maker-category-icon";
import {
  getConverterCategoryGroups,
  getConverterHref,
  getConverterPrimaryInput,
} from "../lib/converters";

type SiteHeaderProps = {
  converters: Converter[];
  currentSlug?: string;
};

const maintenanceNotice =
  "Service notice: We are currently carrying out maintenance and resolving a few issues across the website. Some features may be temporarily limited while these improvements are completed. Full service will be restored as soon as possible.";
const maintenanceNoticeDismissKey = "umthethx-hide-maintenance-notice";

export function SiteHeader({ converters, currentSlug }: SiteHeaderProps) {
  const toggleId = "converter-toggle";
  const converterGroups = getConverterCategoryGroups(converters);
  const t = useTranslations();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const converterToggleRef = useRef<HTMLInputElement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileConvertersOpen, setIsMobileConvertersOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const [isNoteMakerOpen, setIsNoteMakerOpen] = useState(false);
  const [isConvertersOpen, setIsConvertersOpen] = useState(false);
  const [isNoticeVisible, setIsNoticeVisible] = useState(true);

  useEffect(() => {
    if (window.localStorage.getItem(maintenanceNoticeDismissKey) === "1") {
      setIsNoticeVisible(false);
    }
  }, []);

  const setConvertersOpen = (next: boolean) => {
    if (converterToggleRef.current) {
      converterToggleRef.current.checked = next;
    }
    setIsConvertersOpen(next);
  };
  const toggleConverters = () => setConvertersOpen(!isConvertersOpen);
  const closeConverters = () => setConvertersOpen(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsNoteMakerOpen(false);
    closeConverters();
  };
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
    setIsNoteMakerOpen(false);
    closeConverters();
  };
  const toggleMobileConverters = () =>
    setIsMobileConvertersOpen((prev) => !prev);
  const toggleMobileGroup = (title: string) =>
    setOpenMobileGroup((prev) => (prev === title ? null : title));
  const closeNoteMaker = () => setIsNoteMakerOpen(false);
  const toggleNoteMaker = () =>
    setIsNoteMakerOpen((prev) => {
      const next = !prev;
      if (next) {
        closeConverters();
      }
      return next;
    });
  const dismissNotice = () => {
    window.localStorage.setItem(maintenanceNoticeDismissKey, "1");
    setIsNoticeVisible(false);
  };

  const currentMode = normalizeMode(searchParams?.get("mode"));
  const currentSubtype = searchParams?.get("subtype") ?? "";
  const isNoteMakerPage = pathname?.startsWith("/ai-notemaker");
  const activeSubtype =
    currentMode === "general" || currentMode === "smart"
      ? ""
      : currentSubtype;

  const buildNoteMakerHref = (mode: NoteMakerMode, subtype?: string) => {
    const params = new URLSearchParams();
    if (mode && mode !== "general") {
      params.set("mode", mode);
    }
    if (subtype) {
      params.set("subtype", subtype);
    }
    const query = params.toString();
    return query ? `/ai-notemaker?${query}` : "/ai-notemaker";
  };

  return (
    <div
      className={[
        "flex flex-col gap-3",
        isNoticeVisible ? "-mb-3 sm:-mb-4" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        ref={converterToggleRef}
        id={toggleId}
        type="checkbox"
        className="peer sr-only"
        aria-controls="converter-panel"
        aria-label={t("header.toggleConvertersList")}
        onChange={(event) => setIsConvertersOpen(event.target.checked)}
      />
      <label
        htmlFor={toggleId}
        aria-hidden="true"
        tabIndex={-1}
        className="fixed inset-0 z-10 hidden cursor-default peer-checked:block"
      />
      {isNoteMakerOpen ? (
        <button
          type="button"
          aria-hidden="true"
          onClick={closeNoteMaker}
          className="fixed inset-0 z-10 cursor-default"
        />
      ) : null}
      <header className="flex items-center justify-between gap-3 sm:gap-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo/logo%202.png"
            alt="Umthethx logo"
            width={140}
            height={44}
            className="h-4 w-auto sm:h-6 dark:hidden"
            priority
          />
          <Image
            src="/logo/UMTHETHX%20dark%20mode%202.png"
            alt="Umthethx logo"
            width={140}
            height={44}
            className="hidden h-4 w-auto sm:h-6 dark:block"
            priority
          />
          <span className="sr-only">Umthethx</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-6">
          <ThemeToggle />
          <nav className="hidden items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-[var(--muted)] min-[740px]:flex min-[740px]:gap-6 min-[740px]:text-sm">
            <div className="inline-flex overflow-hidden rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 shadow-sm shadow-black/5 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--foreground)]">
              <Link
                href="/"
                onClick={() => {
                  closeNoteMaker();
                  closeConverters();
                }}
                className="inline-flex items-center gap-2 whitespace-nowrap px-3 py-1.5 transition hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[var(--background)] sm:px-4 sm:py-2 sm:text-sm"
              >
                {t("header.converters")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  closeNoteMaker();
                  toggleConverters();
                }}
                aria-controls="converter-panel"
                aria-expanded={isConvertersOpen}
                className="inline-flex items-center justify-center border-l border-zinc-200 px-2 py-1.5 transition hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-[var(--border-1)] dark:focus-visible:ring-offset-[var(--background)] sm:px-3 sm:py-2"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className={[
                    "h-4 w-4 text-zinc-500 transition dark:text-[var(--muted-2)]",
                    isConvertersOpen ? "rotate-180" : "",
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
            </div>
            <div className="inline-flex overflow-hidden rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 shadow-sm shadow-black/5 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--foreground)]">
              <Link
                href="/ai-notemaker"
                onClick={() => {
                  closeConverters();
                  closeNoteMaker();
                }}
                className="inline-flex items-center gap-2 whitespace-nowrap px-3 py-1.5 transition hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[var(--background)] sm:px-4 sm:py-2 sm:text-sm"
              >
                {t("header.noteMakerTypes")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  closeConverters();
                  toggleNoteMaker();
                }}
                aria-controls="notemaker-panel"
                aria-expanded={isNoteMakerOpen}
                className="inline-flex items-center justify-center border-l border-zinc-200 px-2 py-1.5 transition hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-[var(--border-1)] dark:focus-visible:ring-offset-[var(--background)] sm:px-3 sm:py-2"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className={[
                    "h-4 w-4 text-zinc-500 transition dark:text-[var(--muted-2)]",
                    isNoteMakerOpen ? "rotate-180" : "",
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
            </div>
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

      {isNoticeVisible ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-2.5 text-sm text-amber-950 shadow-sm shadow-amber-950/5 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-white/70 text-amber-700 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-200">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 8v5" />
                <path d="M12 16h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
                  Service Notice
                </p>
                <p className="text-sm leading-6 text-amber-950/90 dark:text-amber-50/90">
                  {maintenanceNotice}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissNotice}
              aria-label="Dismiss notice"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-300/70 bg-white/70 text-amber-700 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-200 dark:hover:bg-amber-400/20"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}

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

      <div
        id="notemaker-panel"
        className={[
          "relative z-20 mt-0 max-h-0 w-full overflow-hidden rounded-3xl border border-transparent bg-white/95 p-0 opacity-0 shadow-md shadow-black/10 backdrop-blur transition-all duration-300 ease-out dark:bg-[var(--surface-1)] dark:shadow-none",
          isNoteMakerOpen
            ? "max-h-[360px] border-zinc-300 p-4 opacity-100 dark:border-[var(--border-1)]"
            : "pointer-events-none",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="max-h-[288px] overflow-y-auto pr-2">
          <div className="space-y-5">
            {noteMakerGroups.map((group) => (
              <div key={group.id}>
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-[var(--muted-2)]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-[var(--surface-3)] dark:text-[var(--muted)]">
                    <NoteMakerCategoryIcon name={group.id} className="h-4 w-4" />
                  </div>
                  <span>{t(group.titleKey)}</span>
                </div>
                {group.descriptionKey ? (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                    {t(group.descriptionKey)}
                  </p>
                ) : null}
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => {
                    const isActive =
                      isNoteMakerPage &&
                      item.mode === currentMode &&
                      (item.subtype ?? "") === activeSubtype;
                    return (
                      <Link
                        key={`${item.mode}-${item.subtype ?? "base"}`}
                        href={buildNoteMakerHref(item.mode, item.subtype)}
                        aria-current={isActive ? "page" : undefined}
                        onClick={closeNoteMaker}
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
                          {t(item.labelKey)}
                        </div>
                        <div className="mt-2 text-[11px] text-zinc-500 dark:text-[var(--muted-2)]">
                          {item.descriptionKey
                            ? t(item.descriptionKey)
                            : t(group.descriptionKey ?? group.titleKey)}
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
