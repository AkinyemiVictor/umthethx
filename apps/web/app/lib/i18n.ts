import { cookies } from "next/headers";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "./translations";

export const LANGUAGE_COOKIE = "umthethx_language";

export const isSupportedLanguage = (
  value: string | undefined,
): value is LanguageCode =>
  Boolean(value) &&
  SUPPORTED_LANGUAGES.includes(value as LanguageCode);

export const getCurrentLanguage = async (): Promise<LanguageCode> => {
  const store = await cookies();
  const stored = store.get(LANGUAGE_COOKIE)?.value;
  return isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE;
};
