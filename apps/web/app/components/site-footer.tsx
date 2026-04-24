"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Converter } from "../lib/converters";
import { type TranslationKey } from "../lib/translations";
import { useTranslations } from "./language-provider";
import { getConverterHref } from "../../src/lib/converters";
import { getPathMarket, prefixMarketPath } from "../../src/lib/markets";

type SiteFooterProps = {
  footerConverters: Converter[];
};

const quickLinks: Array<{ key: TranslationKey; href: string }> = [
  { key: "footer.terms", href: "/terms" },
  { key: "footer.privacy", href: "/privacy" },
  { key: "footer.refunds", href: "/refunds" },
  { key: "footer.faq", href: "/faq" },
  { key: "footer.contact", href: "/contact" },
];

const footerNoteMakerTypes: Array<{ key: TranslationKey; href: string }> = [
  { key: "aiNoteMaker.typeSmart", href: "/ai-notemaker?mode=smart" },
  { key: "aiNoteMaker.typeAcademic", href: "/ai-notemaker?mode=academic" },
  { key: "aiNoteMaker.typeMedical", href: "/ai-notemaker?mode=medical" },
  { key: "aiNoteMaker.typeLegal", href: "/ai-notemaker?mode=legal" },
  { key: "aiNoteMaker.typeBusiness", href: "/ai-notemaker?mode=business" },
];

const socialLinks = [
  {
    label: "X",
    href: "https://x.com/umthethx",
    iconSrc: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/x.svg",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/umthethx",
    iconSrc:
      "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/instagram.svg",
  },
  {
    label: "Facebook",
    href: "https://facebook.com/umthethx",
    iconSrc:
      "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/facebook.svg",
  },
];

export function SiteFooter({ footerConverters }: SiteFooterProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const market = getPathMarket(pathname);
  const homeHref = prefixMarketPath("/ocr", market);

  return (
    <footer className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
      <div className="grid gap-8 min-[732px]:grid-cols-3 xl:grid-cols-4">
        <div className="space-y-3 min-[732px]:col-span-3 xl:col-span-1">
          <Link href={homeHref} className="inline-flex">
            <Image
              src="/logo/logo%202.png"
              alt="Umthethx logo"
              width={120}
              height={38}
              className="h-auto w-auto dark:hidden"
            />
            <Image
              src="/logo/UMTHETHX%20dark%20mode%202.png"
              alt="Umthethx logo"
              width={120}
              height={38}
              className="hidden h-auto w-auto dark:block"
            />
          </Link>
          <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
            {t("footer.tagline")}
          </p>
          <a
            href="mailto:contactumthethx@gmail.com"
            className="text-sm font-semibold text-zinc-700 hover:text-zinc-900 dark:text-[var(--muted)] dark:hover:text-[var(--foreground)]"
          >
            contactumthethx@gmail.com
          </a>
          <div className="flex items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-label={`Umthethx on ${link.label}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 shadow-sm shadow-black/5 transition hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] hover:shadow-[0_0_0_1px_var(--brand-ring)] dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--muted)] dark:hover:border-[var(--brand-400)] dark:hover:bg-[var(--brand-50)]"
              >
                <img
                  src={link.iconSrc}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="h-4 w-4 dark:invert"
                />
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
              <li key={converter.title}>
                <Link
                  href={getConverterHref(converter, market)}
                  className="transition hover:text-zinc-900 dark:hover:text-[var(--foreground)]"
                >
                  {converter.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
            {t("header.noteMakerTypes")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-[var(--muted)]">
            {footerNoteMakerTypes.map((item) => (
              <li key={item.key}>
                <Link
                  href={prefixMarketPath(item.href, market)}
                  className="transition hover:text-zinc-900 dark:hover:text-[var(--foreground)]"
                >
                  {t(item.key)}
                </Link>
              </li>
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
                <Link
                  href={prefixMarketPath(link.href, market)}
                  className="transition hover:text-zinc-900 dark:hover:text-[var(--foreground)]"
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-[var(--border-2)] dark:text-[var(--muted-2)]">
        {t("footer.copyright")}
      </div>
    </footer>
  );
}
