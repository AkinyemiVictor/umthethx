"use client";

import { useMemo, useState } from "react";
import { languages } from "../lib/languages";
import { useLanguage, useTranslations } from "./language-provider";

export function LanguageMenu() {
  const { lang, setLanguage } = useLanguage();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const currentLanguage = useMemo(
    () => languages.find((item) => item.code === lang) ?? languages[0],
    [lang],
  );

  return (
    <div className="relative mt-3">
      {open ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-10 cursor-default"
        />
      ) : null}
      <button
        type="button"
        aria-controls="language-menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="relative z-20 flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--foreground)]"
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
          className={[
            "h-4 w-4 text-zinc-500 transition dark:text-[var(--muted-2)]",
            open ? "rotate-180" : "",
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
      <div
        id="language-menu"
        className={[
          "absolute left-0 right-0 top-full z-20 mt-2 max-h-[140px] overflow-y-auto rounded-xl border border-zinc-300 bg-white p-2 shadow-md shadow-black/10 transition",
          "dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <ul className="grid gap-1">
          {languages.map((language) => (
            <li key={language.code}>
              <button
                type="button"
                className="flex h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-sm font-semibold text-zinc-700 transition hover:bg-[var(--brand-50)] hover:text-[var(--brand-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:text-[var(--foreground)]"
                aria-label={t("footer.switchLanguageTo", {
                  language: language.label,
                })}
                onClick={() => {
                  setLanguage(language.code);
                  setOpen(false);
                }}
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
  );
}
