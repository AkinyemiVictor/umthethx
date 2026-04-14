import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "./components/language-provider";
import { PageAds } from "./components/page-ads";
import { ADSENSE_CLIENT_ID, ADSENSE_ENABLED } from "./lib/adsense";
import { getCurrentLanguage } from "./lib/i18n";
import { getCurrentMarket } from "./lib/markets";
import { defaultMetadata } from "./lib/seo";
import { getMessages, getTranslator } from "./lib/translations";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  ...defaultMetadata,
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon/favicon.png", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaMeasurementId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-V1H324ZER7";
  const shouldEnableAnalytics =
    process.env.NODE_ENV === "production" && Boolean(gaMeasurementId);
  const shouldEnableAdSense =
    process.env.NODE_ENV === "production" &&
    ADSENSE_ENABLED &&
    Boolean(ADSENSE_CLIENT_ID);
  const lang = await getCurrentLanguage();
  const market = await getCurrentMarket();
  const messages = getMessages(lang);
  const t = getTranslator(lang);

  return (
    <html lang={lang} data-market={market}>
      <head>
        {shouldEnableAdSense ? (
          <Script
            id="adsense-loader"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            strategy="beforeInteractive"
            crossOrigin="anonymous"
            async
          />
        ) : null}
      </head>
      <body
        data-market={market}
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        {shouldEnableAnalytics ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}');
              `}
            </Script>
          </>
        ) : null}
        <LanguageProvider lang={lang} messages={messages}>
          <PageAds label={t("ads.label")} text={t("ads.text")}>
            {children}
          </PageAds>
        </LanguageProvider>
      </body>
    </html>
  );
}
