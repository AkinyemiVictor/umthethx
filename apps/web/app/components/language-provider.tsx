"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  formatMessage,
  type LanguageCode,
  type Messages,
  type TranslationKey,
  type TranslationValues,
} from "../lib/translations";

type LanguageContextValue = {
  lang: LanguageCode;
  setLanguage: (next: LanguageCode) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  lang: LanguageCode;
  messages: Messages;
  children: ReactNode;
};

const cookieName = "umthethx_language";

const isSupportedLanguage = (value: string): value is LanguageCode =>
  SUPPORTED_LANGUAGES.includes(value as LanguageCode);

export function LanguageProvider({
  lang,
  messages,
  children,
}: LanguageProviderProps) {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState<LanguageCode>(lang);
  const [currentMessages, setCurrentMessages] = useState<Messages>(messages);

  useEffect(() => {
    setCurrentLang(lang);
    setCurrentMessages(messages);
  }, [lang, messages]);

  useEffect(() => {
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const setLanguage = (next: LanguageCode) => {
    const resolved = isSupportedLanguage(next) ? next : DEFAULT_LANGUAGE;
    if (resolved === currentLang) return;
    document.cookie = `${cookieName}=${resolved}; path=/; max-age=31536000; SameSite=Lax`;
    setCurrentLang(resolved);
    router.refresh();
  };

  const t = useMemo(
    () => (key: TranslationKey, values?: TranslationValues) =>
      formatMessage(currentMessages[key] ?? String(key), values),
    [currentMessages],
  );

  return (
    <LanguageContext.Provider value={{ lang: currentLang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider.");
  }
  return { lang: context.lang, setLanguage: context.setLanguage };
};

export const useTranslations = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslations must be used within LanguageProvider.");
  }
  return context.t;
};
