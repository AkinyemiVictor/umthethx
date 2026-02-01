import { AdSlot } from "./ad-slot";

type MobileRectangleAdsProps = {
  label: string;
  text: string;
};

export function MobileRectangleAds({ label, text }: MobileRectangleAdsProps) {
  return (
    <div className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 2xl:hidden">
      <AdSlot
        label={label}
        text={text}
        slot="rectangle-top"
        className="h-[250px] w-full"
      />
      <AdSlot
        label={label}
        text={text}
        slot="rectangle-bottom"
        className="h-[250px] w-full"
      />
    </div>
  );
}
