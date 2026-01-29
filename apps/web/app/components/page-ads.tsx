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
      {children}

      <div className="hidden 2xl:block">
        <div className="pointer-events-none fixed left-4 top-28 z-20">
          <div className="pointer-events-auto">
            <AdSlot
              label={label}
              text={text}
              slot="skyscraper-left"
              className="h-[600px] w-[160px]"
            />
          </div>
        </div>
        <div className="pointer-events-none fixed right-4 top-28 z-20">
          <div className="pointer-events-auto">
            <AdSlot
              label={label}
              text={text}
              slot="skyscraper-right"
              className="h-[600px] w-[160px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
