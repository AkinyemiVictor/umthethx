import type { ReactNode } from "react";

type AdSlotProps = {
  label?: string;
<<<<<<< HEAD
  text?: string;
};

export function AdSlot({
  plan,
  label = "Advertisement slot",
  text = "Ad space",
}: AdSlotProps) {
  if (plan !== "free") {
    return null;
  }
=======
  slot?: string;
  className?: string;
  children?: ReactNode;
};

export function AdSlot({
  label = "Advertisement slot",
  slot,
  className,
  children,
}: AdSlotProps) {
>>>>>>> 6ef1f89173997d7443971dba4d0659a74eb5c9d9

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
<<<<<<< HEAD
      {text}
=======
      {children ?? "Ad"}
>>>>>>> 6ef1f89173997d7443971dba4d0659a74eb5c9d9
    </div>
  );
}
