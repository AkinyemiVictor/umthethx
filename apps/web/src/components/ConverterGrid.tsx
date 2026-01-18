import Link from "next/link";
import { FileChip } from "@repo/ui/file-chip";
import { ConverterCategoryIcon } from "../../app/components/converter-category-icon";
import type { Converter } from "../lib/converters";
import {
  getConverterCategoryGroups,
  getConverterHref,
  getConverterPrimaryInput,
} from "../lib/converters";

type ConverterGridProps = {
  converters: Converter[];
  currentSlug?: string;
  heading?: string;
  description?: string;
};

export function ConverterGrid({
  converters,
  currentSlug,
  heading = "Converters",
  description = "Switch to another converter in one click.",
}: ConverterGridProps) {
  const converterGroups = getConverterCategoryGroups(converters);

  return (
    <section
      id="converters"
      className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{heading}</h2>
          <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {converterGroups.map((group) => (
          <div
            key={group.title}
            className="rounded-2xl border border-zinc-300 bg-white/95 p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none"
          >
            <div>
              <div className="flex items-center gap-3">
                <ConverterCategoryIcon
                  name={group.icon}
                  className="h-7 w-7 text-slate-700 dark:text-slate-100"
                />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                  {group.title}
                </h3>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                {group.description}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {group.items.map((item) => {
                const isActive = item.slug === currentSlug;
                return (
                  <Link
                    key={item.slug}
                    href={getConverterHref(item)}
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
                      {item.title}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-[var(--muted-2)]">
                      <FileChip ext={getConverterPrimaryInput(item)} />
                      <span className="text-zinc-400">-&gt;</span>
                      <FileChip ext={item.outputFormat} />
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
