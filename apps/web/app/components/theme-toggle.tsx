"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "./language-provider";

type ThemeMode = "light" | "dark";

const storageKey = "umthethx-theme";

const applyThemeClass = (mode: ThemeMode) => {
  document.documentElement.classList.toggle("dark", mode === "dark");
};

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("light");
  const t = useTranslations();

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    const resolved =
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setMode(resolved);
    applyThemeClass(resolved);
  }, []);

  const isDark = mode === "dark";

  const handleToggle = () => {
    const next = isDark ? "light" : "dark";
    setMode(next);
    localStorage.setItem(storageKey, next);
    applyThemeClass(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={t("theme.toggleLabel")}
      onClick={handleToggle}
      className="inline-flex items-center gap-2 text-[11px] font-semibold text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-[var(--foreground)] dark:focus-visible:ring-offset-[var(--background)] sm:text-xs"
    >
      <span
        aria-hidden="true"
        className={[
          "relative inline-flex h-5 w-9 items-center rounded-full border transition-colors",
          isDark
            ? "border-[var(--brand-500)] bg-[var(--brand-500)]"
            : "border-zinc-400 bg-zinc-500/70",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span
          className={[
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            isDark ? "translate-x-4" : "translate-x-0",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      </span>
      <span className="whitespace-nowrap">
        {isDark ? t("theme.dark") : t("theme.light")}
      </span>
    </button>
  );
}
