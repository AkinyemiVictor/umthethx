import Image from "next/image";
import type { Converter } from "../lib/converters";
import { languages } from "../lib/languages";

type SiteFooterProps = {
  footerConverters: Converter[];
};

const quickLinks = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Refund Policy", href: "/refunds" },
  { label: "Contact Us", href: "/contact" },
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
  const currentLanguage = languages[0];

  return (
    <footer className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-none">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Image
            src="/logo/Artboard 1.png"
            alt="Umthethx logo"
            width={120}
            height={38}
          />
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            AI-powered converters for images, documents, and more.
          </p>
          <a
            href="mailto:support@umthethx.com"
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
          >
            support@umthethx.com
          </a>
          <div className="flex items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-label={`Umthethx on ${link.label}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-orange-600 transition hover:border-orange-200 hover:bg-orange-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-orange-300 dark:hover:border-orange-400/50"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Converters
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            {footerConverters.map((converter) => (
              <li key={converter.title}>{converter.title}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Quick links
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            {quickLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="transition hover:text-orange-600 dark:hover:text-orange-300"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Language
          </h3>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
            Change the display language for the entire experience.
          </p>
          <div className="relative mt-3">
            <input
              id="language-toggle"
              type="checkbox"
              className="peer sr-only"
              aria-controls="language-menu"
              aria-label="Toggle language menu"
            />
            <label
              htmlFor="language-toggle"
              aria-hidden="true"
              tabIndex={-1}
              className="fixed inset-0 z-10 hidden cursor-default peer-checked:block"
            />
            <label
              htmlFor="language-toggle"
              className="relative z-20 flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-orange-200 hover:bg-orange-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 peer-checked:[&>svg]:rotate-180 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10 [&::-webkit-details-marker]:hidden"
            >
              <span className="flex items-center gap-2">
                <span className="rounded-sm border border-black/10">
                  {currentLanguage.flag}
                </span>
                {currentLanguage.label}
              </span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-4 w-4 text-orange-500 transition"
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
            <div
              id="language-menu"
              className="pointer-events-none absolute left-0 right-0 top-full z-20 mt-2 max-h-[140px] translate-y-1 overflow-y-auto rounded-xl border border-zinc-300 bg-white p-2 opacity-0 shadow-md shadow-black/10 transition peer-checked:pointer-events-auto peer-checked:translate-y-0 peer-checked:opacity-100 dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-none"
            >
              <ul className="grid gap-1">
                {languages.map((language) => (
                  <li key={language.code}>
                    <button
                      type="button"
                      className="flex h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-sm font-semibold text-zinc-700 transition hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-zinc-200 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
                      aria-label={`Switch language to ${language.label}`}
                    >
                      <span className="rounded-sm border border-black/10">
                        {language.flag}
                      </span>
                      <span className="truncate">{language.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        (c) 2026 Umthethx. All rights reserved.
      </div>
    </footer>
  );
}
