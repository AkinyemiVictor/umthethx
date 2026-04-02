import { cookies } from "next/headers";
import { DEFAULT_LANGUAGE, type LanguageCode } from "./translations";

export const LANGUAGE_COOKIE = "umthethx_language";

export const getCurrentLanguage = async (): Promise<LanguageCode> => {
  // Keep this route tree dynamic so client components using search params
  // do not get forced through static prerendering.
  await cookies();
  return DEFAULT_LANGUAGE;
};
