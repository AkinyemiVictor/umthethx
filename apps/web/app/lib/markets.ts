import { headers } from "next/headers";
import {
  DEFAULT_MARKET,
  MARKET_HEADER,
  normalizeMarket,
  prefixMarketPath,
  stripMarketPrefix,
  type MarketCode,
} from "../../src/lib/markets";

export {
  DEFAULT_MARKET,
  MARKET_HEADER,
  prefixMarketPath,
  stripMarketPrefix,
  type MarketCode,
} from "../../src/lib/markets";

export const getCurrentMarket = async (): Promise<MarketCode> => {
  const requestHeaders = await headers();
  return normalizeMarket(requestHeaders.get(MARKET_HEADER));
};

export const getScopedPath = async (path: string) => {
  const market = await getCurrentMarket();
  return prefixMarketPath(path, market ?? DEFAULT_MARKET);
};

