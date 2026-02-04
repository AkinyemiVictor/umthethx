import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LanguageProvider } from "./components/language-provider";
import { PageAds } from "./components/page-ads";
import { getCurrentLanguage } from "./lib/i18n";
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
  title: "Umthethx",
  description:
    "Free, ad-supported online file converter for images, documents, and more.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon/favicon.png", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getCurrentLanguage();
  const messages = getMessages(lang);
  const t = getTranslator(lang);

  return (
    <html lang={lang}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <LanguageProvider lang={lang} messages={messages}>
          <PageAds label={t("ads.label")} text={t("ads.text")}>
            {children}
          </PageAds>
        </LanguageProvider>
      </body>
    </html>
  );
}
