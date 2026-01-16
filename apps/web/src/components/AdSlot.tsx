import type { ReactNode } from "react";

type UserPlan = "free" | "pro";

type AdSlotProps = {
  plan: UserPlan;
  slot?: string;
  className?: string;
  children?: ReactNode;
};

export function AdSlot({ plan, slot, className, children }: AdSlotProps) {
  if (plan !== "free") {
    return null;
  }

  return (
    <div
      data-slot={slot}
      className={[
        "flex min-h-[160px] w-full items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white/95 text-sm font-semibold text-zinc-500 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--muted-2)] dark:shadow-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children ?? "Ad"}
    </div>
  );
}
