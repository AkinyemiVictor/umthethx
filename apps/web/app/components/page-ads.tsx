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
      <div className="hidden 2xl:block">
        <div className="pointer-events-none fixed inset-x-0 top-28 z-10">
          <div className="mx-auto w-full max-w-[calc(72rem+2*(160px+24px))] px-6">
            <div className="flex justify-between">
              <div className="pointer-events-auto h-[600px] w-[160px]">
                <AdSlot
                  label={label}
                  text={text}
                  slot="skyscraper-left"
                  className="h-[600px] w-[160px] rounded-2xl text-[11px]"
                />
              </div>
              <div className="pointer-events-auto h-[600px] w-[160px]">
                <AdSlot
                  label={label}
                  text={text}
                  slot="skyscraper-right"
                  className="h-[600px] w-[160px] rounded-2xl text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[calc(72rem+2*(160px+24px))] px-6">
          <div className="min-w-0">{children}</div>
        </div>
      </div>
      <div className="2xl:hidden">{children}</div>
    </div>
  );
}
