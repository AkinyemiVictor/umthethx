"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  noteMakerGroups,
  normalizeMode,
  type NoteMakerMode,
} from "../lib/ai-notemaker-types";
import { useTranslations } from "./language-provider";
import { NoteMakerCategoryIcon } from "./note-maker-category-icon";

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

export function AiNoteMakerTypeGrid() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const currentMode = normalizeMode(searchParams?.get("mode"));
  const currentSubtype = searchParams?.get("subtype") ?? "";
  const activeSubtype =
    currentMode === "general" || currentMode === "smart"
      ? ""
      : currentSubtype;

  return (
    <section
      id="notemaker-types"
      className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            {t("aiNoteMaker.typeGridTitle")}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
            {t("aiNoteMaker.typeGridDescription")}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {noteMakerGroups.map((group) => (
          <div
            key={group.id}
            className="rounded-2xl border border-zinc-300 bg-white/95 p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-[var(--surface-3)] dark:text-[var(--muted)]">
                  <NoteMakerCategoryIcon name={group.id} className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                  {t(group.titleKey)}
                </h3>
              </div>
              {group.descriptionKey ? (
                <p className="mt-1 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                  {t(group.descriptionKey)}
                </p>
              ) : null}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {group.items.map((item) => {
                const isActive =
                  item.mode === currentMode &&
                  (item.subtype ?? "") === activeSubtype;
                return (
                  <Link
                    key={`${item.mode}-${item.subtype ?? "base"}`}
                    href={buildNoteMakerHref(item.mode, item.subtype)}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "rounded-xl border p-3 transition",
                      "border-zinc-200 bg-white hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)]",
                      "dark:border-[var(--border-2)] dark:bg-[var(--surface-3)]",
                      isActive
                        ? "border-[var(--brand-500)] bg-[var(--brand-50)]"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="text-xs font-semibold text-zinc-900 dark:text-[var(--foreground)]">
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
    </section>
  );
}
