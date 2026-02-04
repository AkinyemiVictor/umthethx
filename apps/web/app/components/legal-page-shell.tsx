import type { ReactNode } from "react";
import { converters, footerConverters } from "../lib/converters";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

type LegalPageShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function LegalPageShell({
  title,
  description,
  children,
}: LegalPageShellProps) {
  return (
    <div className="relative min-h-screen bg-white text-zinc-900 dark:bg-[var(--background)] dark:text-[var(--foreground)]">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <SiteHeader converters={converters} />

        <main className="rounded-3xl border border-zinc-300 bg-white/95 p-6 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-1)] dark:bg-[var(--surface-1)] dark:shadow-none">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-[var(--muted-2)]">
              Umthethx
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-sm text-zinc-600 dark:text-[var(--muted)]">
                {description}
              </p>
            ) : null}
          </header>

          <div className="mt-6 space-y-6 text-sm leading-6 text-zinc-700 dark:text-[var(--muted)]">
            {children}
          </div>
        </main>

        <SiteFooter footerConverters={footerConverters} />
      </div>
    </div>
  );
}
