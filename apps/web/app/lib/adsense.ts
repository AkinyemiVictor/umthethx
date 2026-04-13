type NamedAdSlot =
  | "home-inline"
  | "home-footer"
  | "converter-inline"
  | "converter-footer"
  | "ai-notemaker-inline"
  | "ai-notemaker-footer"
  | "rectangle-top"
  | "rectangle-bottom"
  | "skyscraper-left"
  | "skyscraper-right";

type AdSensePlacement = {
  slotId?: string;
  format: "auto" | "rectangle" | "vertical";
  fullWidthResponsive?: boolean;
};

export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-1041444647484987";

export const ADSENSE_ENABLED =
  process.env.NEXT_PUBLIC_ADSENSE_ENABLED !== "false";

const SLOT_IDS: Record<NamedAdSlot, string | undefined> = {
  "home-inline": process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_INLINE,
  "home-footer": process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_FOOTER,
  "converter-inline": process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONVERTER_INLINE,
  "converter-footer": process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONVERTER_FOOTER,
  "ai-notemaker-inline":
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_AI_NOTEMAKER_INLINE,
  "ai-notemaker-footer":
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_AI_NOTEMAKER_FOOTER,
  "rectangle-top": process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE_TOP,
  "rectangle-bottom": process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE_BOTTOM,
  "skyscraper-left": process.env.NEXT_PUBLIC_ADSENSE_SLOT_SKYSCRAPER_LEFT,
  "skyscraper-right": process.env.NEXT_PUBLIC_ADSENSE_SLOT_SKYSCRAPER_RIGHT,
};

const SLOT_CONFIGS: Record<NamedAdSlot, AdSensePlacement> = {
  "home-inline": {
    slotId: SLOT_IDS["home-inline"],
    format: "auto",
    fullWidthResponsive: true,
  },
  "home-footer": {
    slotId: SLOT_IDS["home-footer"],
    format: "auto",
    fullWidthResponsive: true,
  },
  "converter-inline": {
    slotId: SLOT_IDS["converter-inline"],
    format: "auto",
    fullWidthResponsive: true,
  },
  "converter-footer": {
    slotId: SLOT_IDS["converter-footer"],
    format: "auto",
    fullWidthResponsive: true,
  },
  "ai-notemaker-inline": {
    slotId: SLOT_IDS["ai-notemaker-inline"],
    format: "auto",
    fullWidthResponsive: true,
  },
  "ai-notemaker-footer": {
    slotId: SLOT_IDS["ai-notemaker-footer"],
    format: "auto",
    fullWidthResponsive: true,
  },
  "rectangle-top": {
    slotId: SLOT_IDS["rectangle-top"],
    format: "rectangle",
  },
  "rectangle-bottom": {
    slotId: SLOT_IDS["rectangle-bottom"],
    format: "rectangle",
  },
  "skyscraper-left": {
    slotId: SLOT_IDS["skyscraper-left"],
    format: "vertical",
  },
  "skyscraper-right": {
    slotId: SLOT_IDS["skyscraper-right"],
    format: "vertical",
  },
};

export function getAdSensePlacement(slot?: string): AdSensePlacement | null {
  if (!slot) {
    return null;
  }

  if (/^\d+$/.test(slot)) {
    return {
      slotId: slot,
      format: "auto",
      fullWidthResponsive: true,
    };
  }

  if (slot in SLOT_CONFIGS) {
    return SLOT_CONFIGS[slot as NamedAdSlot];
  }

  return null;
}
