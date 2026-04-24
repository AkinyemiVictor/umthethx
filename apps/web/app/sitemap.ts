import type { MetadataRoute } from "next";
import { converters, getConverterHref } from "../src/lib/converters";
import {
  DEFAULT_MARKET,
  prefixMarketPath,
  supportedMarkets,
  type MarketCode,
} from "../src/lib/markets";
import { absoluteUrl } from "./lib/seo";

const staticPages: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/ocr", changeFrequency: "daily", priority: 1 },
  { path: "/ai-notemaker", changeFrequency: "weekly", priority: 0.9 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.4 },
  { path: "/refunds", changeFrequency: "monthly", priority: 0.4 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.4 },
];

const markets: MarketCode[] = [DEFAULT_MARKET, ...supportedMarkets];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const pageEntries = staticPages.flatMap(({ path, changeFrequency, priority }) =>
    markets.map((market) => ({
      url: absoluteUrl(prefixMarketPath(path, market)),
      lastModified,
      changeFrequency,
      priority,
    })),
  );

  const converterEntries = converters.flatMap((converter) =>
    markets.map((market) => ({
      url: absoluteUrl(getConverterHref(converter, market)),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: converter.isHomeFeatured ? 0.9 : 0.8,
    })),
  );

  return [...pageEntries, ...converterEntries];
}
