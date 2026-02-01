"use client";

import Image from "next/image";
import type { Converter } from "../lib/converters";
import { type TranslationKey } from "../lib/translations";
import { LanguageMenu } from "./language-menu";
import { useTranslations } from "./language-provider";

type SiteFooterProps = {
  footerConverters: Converter[];
};

const quickLinks: Array<{ key: TranslationKey; href: string }> = [
  { key: "footer.terms", href: "/terms" },
  { key: "footer.privacy", href: "/privacy" },
  { key: "footer.refunds", href: "/refunds" },
  { key: "footer.contact", href: "/contact" },
];

const socialLinks = [
  {
    label: "X",
    href: "https://x.com/umthethx",
    icon: (
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
        <path d="M4 4l16 16" />
        <path d="M20 4L4 20" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com/umthethx",
    icon: (
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
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17" cy="7" r="1" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/umthethx",
    icon: (
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
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 11v6" />
        <path d="M8 8h.01" />
        <path d="M12 11v6" />
        <path d="M12 13c0-1.7 3-1.9 3 0v4" />
      </svg>
    ),
  },
];

export function SiteFooter({ footerConverters }: SiteFooterProps) {
  const t = useTranslations();

  return (
    <footer className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Image
            src="/logo/logo.png"
            alt="Umthethx logo"
            width={120}
            height={38}
            className="h-auto w-auto"
          />
          <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
            {t("footer.tagline")}
          </p>
          <a
            href="mailto:support@umthethx.com"
            className="text-sm font-semibold text-zinc-700 hover:text-zinc-900 dark:text-[var(--muted)] dark:hover:text-[var(--foreground)]"
          >
            support@umthethx.com
          </a>
          <div className="flex items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-label={`Umthethx on ${link.label}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--muted)] dark:hover:border-[var(--border-1)] dark:hover:bg-[var(--surface-3)]"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
            {t("footer.converters")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-[var(--muted)]">
            {footerConverters.map((converter) => (
              <li key={converter.title}>{converter.title}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
            {t("footer.quickLinks")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-[var(--muted)]">
            {quickLinks.map((link) => (
              <li key={link.key}>
                <a
                  href={link.href}
                  className="transition hover:text-zinc-900 dark:hover:text-[var(--foreground)]"
                >
                  {t(link.key)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
            {t("footer.language")}
          </h3>
          <p className="mt-3 text-sm text-zinc-600 dark:text-[var(--muted)]">
            {t("footer.languageDescription")}
          </p>
          <LanguageMenu />
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-[var(--border-2)] dark:text-[var(--muted-2)]">
        {t("footer.copyright")}
      </div>
    </footer>
  );
}
