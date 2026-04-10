"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  ADSENSE_CLIENT_ID,
  ADSENSE_ENABLED,
  getAdSensePlacement,
} from "../lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

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
  const adRef = useRef<HTMLModElement | null>(null);
  const placement = getAdSensePlacement(slot);
  const canRenderAd =
    process.env.NODE_ENV === "production" &&
    ADSENSE_ENABLED &&
    Boolean(ADSENSE_CLIENT_ID) &&
    Boolean(placement?.slotId);

  useEffect(() => {
    if (!canRenderAd || !adRef.current) {
      return;
    }

    if (adRef.current.getAttribute("data-adsbygoogle-status")) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Keep the page stable if the AdSense script is blocked or delayed.
    }
  }, [canRenderAd, placement?.slotId]);

  const sharedClassName = [
    "w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (canRenderAd && placement?.slotId) {
    return (
      <div
        aria-label={label}
        data-slot={slot}
        className={[
          "min-h-[160px] overflow-hidden rounded-3xl border border-zinc-200 bg-white/95 shadow-md shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none",
          sharedClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <ins
          ref={adRef}
          className="adsbygoogle block h-full w-full"
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-format={placement.format}
          data-ad-slot={placement.slotId}
          data-full-width-responsive={
            placement.fullWidthResponsive ? "true" : undefined
          }
          style={{
            display: "block",
            height: "100%",
            minHeight: "160px",
            width: "100%",
          }}
        />
      </div>
    );
  }

  return (
    <div
      aria-label={label}
      data-slot={slot}
      className={[
        "flex min-h-[160px] w-full items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white/95 text-sm font-semibold text-zinc-500 shadow-md shadow-black/10 backdrop-blur dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--muted-2)] dark:shadow-none",
        sharedClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {content}
    </div>
  );
}
