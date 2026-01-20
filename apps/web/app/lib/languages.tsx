import type { ReactElement } from "react";
import type { LanguageCode } from "./translations";

export type Language = {
  code: LanguageCode;
  label: string;
  flag: ReactElement;
};

const FlagUs = () => (
  <svg viewBox="0 0 24 16" className="h-4 w-6" aria-hidden="true">
    <rect width="24" height="16" fill="#b91c1c" />
    <rect y="3" width="24" height="2" fill="#ffffff" />
    <rect y="7" width="24" height="2" fill="#ffffff" />
    <rect y="11" width="24" height="2" fill="#ffffff" />
    <rect width="10" height="7" fill="#1e3a8a" />
  </svg>
);

const FlagFr = () => (
  <svg viewBox="0 0 24 16" className="h-4 w-6" aria-hidden="true">
    <rect width="8" height="16" fill="#1d4ed8" />
    <rect x="8" width="8" height="16" fill="#ffffff" />
    <rect x="16" width="8" height="16" fill="#dc2626" />
  </svg>
);

const FlagEs = () => (
  <svg viewBox="0 0 24 16" className="h-4 w-6" aria-hidden="true">
    <rect width="24" height="16" fill="#b91c1c" />
    <rect y="4" width="24" height="8" fill="#facc15" />
  </svg>
);

const FlagDe = () => (
  <svg viewBox="0 0 24 16" className="h-4 w-6" aria-hidden="true">
    <rect width="24" height="5.3" fill="#111827" />
    <rect y="5.3" width="24" height="5.3" fill="#b91c1c" />
    <rect y="10.6" width="24" height="5.4" fill="#fbbf24" />
  </svg>
);

const FlagPt = () => (
  <svg viewBox="0 0 24 16" className="h-4 w-6" aria-hidden="true">
    <rect width="24" height="16" fill="#b91c1c" />
    <rect width="10" height="16" fill="#15803d" />
    <circle cx="10" cy="8" r="3" fill="#facc15" />
  </svg>
);

const FlagAr = () => (
  <svg viewBox="0 0 24 16" className="h-4 w-6" aria-hidden="true">
    <rect width="24" height="16" fill="#15803d" />
    <rect x="5" y="7" width="14" height="2" fill="#ffffff" />
  </svg>
);

export const languages: Language[] = [
  { code: "en", label: "English", flag: <FlagUs /> },
  { code: "fr", label: "French", flag: <FlagFr /> },
  { code: "es", label: "Spanish", flag: <FlagEs /> },
  { code: "de", label: "German", flag: <FlagDe /> },
  { code: "pt", label: "Portuguese", flag: <FlagPt /> },
  { code: "ar", label: "Arabic", flag: <FlagAr /> },
];
