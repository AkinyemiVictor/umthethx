import type { ReactNode } from "react";
import { AdSlot } from "./ad-slot";

type PageAdsProps = {
  label: string;
  text: string;
  children: ReactNode;
};

export function PageAds({ label, text, children }: PageAdsProps) {
  return (
    <div className="relative">
      <div className="hidden 2xl:grid mx-auto w-full max-w-[calc(72rem+2*(160px+24px))] grid-cols-[160px_minmax(0,72rem)_160px] gap-6 px-6">
        <div className="sticky top-28 self-start">
          <AdSlot
            label={label}
            text={text}
            slot="skyscraper-left"
            className="h-[600px] w-[160px] rounded-2xl text-[11px]"
          />
        </div>
        <div className="min-w-0">{children}</div>
        <div className="sticky top-28 self-start">
          <AdSlot
            label={label}
            text={text}
            slot="skyscraper-right"
            className="h-[600px] w-[160px] rounded-2xl text-[11px]"
          />
        </div>
      </div>
      <div className="2xl:hidden">{children}</div>
    </div>
  );
}
