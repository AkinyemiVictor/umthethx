type AdSlotProps = {
  label?: string;
};

export function AdSlot({ label = "Advertisement slot" }: AdSlotProps) {
  return (
    <div
      aria-label={label}
      className="flex min-h-[240px] w-full items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white/95 text-sm font-semibold text-zinc-500 shadow-md shadow-black/10 backdrop-blur dark:border-zinc-700 dark:bg-zinc-950/90 dark:text-zinc-400 dark:shadow-none"
    >
      Ad space
    </div>
  );
}
