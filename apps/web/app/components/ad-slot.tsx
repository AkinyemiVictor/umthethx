type AdSlotProps = {
  plan: "free" | "pro";
  label?: string;
};

export function AdSlot({ plan, label = "Advertisement slot" }: AdSlotProps) {
  if (plan !== "free") {
    return null;
  }

  return (
    <div
      aria-label={label}
      className="flex min-h-[240px] w-full items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white/95 text-sm font-semibold text-zinc-500 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--muted-2)] dark:shadow-none"
    >
      Ad space
    </div>
  );
}
