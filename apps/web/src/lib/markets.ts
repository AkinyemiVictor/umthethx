export const MARKET_HEADER = "x-umthethx-market";

export const supportedMarkets = ["ng", "za", "ug"] as const;

export type SupportedMarket = (typeof supportedMarkets)[number];
export type MarketCode = SupportedMarket | "global";

export const DEFAULT_MARKET: MarketCode = "global";
export const defaultHrefLang = "x-default";
export const marketHrefLangMap: Record<SupportedMarket, string> = {
  ng: "en-ng",
  za: "en-za",
  ug: "en-ug",
};

const supportedMarketSet = new Set<string>(supportedMarkets);
const marketRouteAliases = new Map<string, string>([
  ["/ocr", "/"],
  ["/notemaker", "/ai-notemaker"],
]);

export const normalizeMarket = (value?: string | null): MarketCode => {
  const normalized = value?.trim().toLowerCase();
  return normalized && supportedMarketSet.has(normalized)
    ? (normalized as SupportedMarket)
    : DEFAULT_MARKET;
};

export const getPathMarket = (pathname?: string | null): MarketCode => {
  if (!pathname) {
    return DEFAULT_MARKET;
  }

  const [segment = ""] = pathname.split("/").filter(Boolean);
  return normalizeMarket(segment);
};

export const stripMarketPrefix = (pathname?: string | null) => {
  const rawPath = pathname?.trim() || "/";
  const normalizedPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const market = getPathMarket(normalizedPath);

  if (market === DEFAULT_MARKET) {
    return { market, pathname: normalizedPath };
  }

  const suffix = normalizedPath.slice(market.length + 1);
  return {
    market,
    pathname: suffix.startsWith("/") ? suffix : suffix ? `/${suffix}` : "/",
  };
};

export const resolveMarketPathAlias = (pathname?: string | null) => {
  const normalizedPath = pathname?.trim() || "/";
  return marketRouteAliases.get(normalizedPath) ?? normalizedPath;
};

export const prefixMarketPath = (
  path: string,
  market: MarketCode = DEFAULT_MARKET,
) => {
  if (!path) {
    return market === DEFAULT_MARKET ? "/" : `/${market}`;
  }

  if (/^[a-z]+:\/\//i.test(path) || path.startsWith("//")) {
    return path;
  }

  const [pathAndQuery = "/", hash = ""] = path.split("#", 2);
  const [pathname = "/", query = ""] = pathAndQuery.split("?", 2);
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const { pathname: basePath } = stripMarketPrefix(normalizedPathname);

  const scopedPath =
    market === DEFAULT_MARKET
      ? basePath
      : basePath === "/"
        ? `/${market}`
        : `/${market}${basePath}`;

  const queryPart = query ? `?${query}` : "";
  const hashPart = hash ? `#${hash}` : "";

  return `${scopedPath}${queryPart}${hashPart}`;
};
