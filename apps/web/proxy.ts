import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DEFAULT_MARKET,
  MARKET_HEADER,
  resolveMarketPathAlias,
  stripMarketPrefix,
} from "./src/lib/markets";

const PUBLIC_FILE_PATTERN = /\.[^/]+$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/logo/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/apple-touch-icon") ||
    PUBLIC_FILE_PATTERN.test(pathname)
  ) {
    return NextResponse.next();
  }

  const { market, pathname: strippedPathname } = stripMarketPrefix(pathname);
  const resolvedPathname = resolveMarketPathAlias(strippedPathname);

  if (market === DEFAULT_MARKET && resolvedPathname === pathname) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = resolvedPathname;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(MARKET_HEADER, market);

  return NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|apple-touch-icon.png).*)",
  ],
};
