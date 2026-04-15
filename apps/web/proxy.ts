import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DEFAULT_MARKET,
  MARKET_HEADER,
  resolveMarketPathAlias,
  stripMarketPrefix,
} from "./src/lib/markets";

const APEX_HOST = "umthethx.online";
const CANONICAL_HOST = "www.umthethx.online";
const PUBLIC_FILE_PATTERN = /\.[^/]+$/;

export function proxy(request: NextRequest) {
  const hostHeader =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const host = hostHeader.split(",")[0]?.trim().split(":")[0]?.toLowerCase();

  if (host === APEX_HOST) {
    const redirectUrl = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      `https://${CANONICAL_HOST}`,
    );
    return NextResponse.redirect(redirectUrl, 308);
  }

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
    "/((?!_next/static|_next/image).*)",
  ],
};
