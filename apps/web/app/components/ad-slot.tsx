import type { ReactNode } from "react";

type AdSlotProps = {
  label?: string;
  slot?: string;
  className?: string;
  text?: string;
  children?: ReactNode;
  plan?: "free" | "pro";
};

export function AdSlot({
  label = "Advertisement slot",
  slot,
  className,
  text,
  children,
  plan,
}: AdSlotProps) {
  if (plan && plan !== "free") {
    return null;
  }

  const content = children ?? text ?? "Ad";

  return (
    <div
      aria-label={label}
      data-slot={slot}
      className={[
        "flex min-h-[160px] w-full items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white/95 text-sm font-semibold text-zinc-500 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--muted-2)] dark:shadow-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {content}
    </div>
  );
}
