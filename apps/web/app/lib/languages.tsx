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

const FlagZa = () => (
  <svg viewBox="0 0 24 16" className="h-4 w-6" aria-hidden="true">
    <rect width="24" height="16" fill="#1f2937" />
    <path d="M0 0 10 8 0 16" fill="#15803d" />
    <path d="M0 2 8 8 0 14" fill="#facc15" />
    <path d="M0 4 6 8 0 12" fill="#111827" />
    <path d="M10 0h14v8H10z" fill="#dc2626" />
    <path d="M10 8h14v8H10z" fill="#1d4ed8" />
    <path d="M9 0h2v16H9z" fill="#ffffff" />
  </svg>
);

const FlagAr = () => (
  <svg viewBox="0 0 24 16" className="h-4 w-6" aria-hidden="true">
    <rect width="24" height="16" fill="#15803d" />
    <rect x="5" y="7" width="14" height="2" fill="#ffffff" />
  </svg>
);

export const defaultLanguage: Language = {
  code: "en",
  label: "English",
  flag: <FlagUs />,
};

export const languages: Language[] = [
  defaultLanguage,
  { code: "fr", label: "Français", flag: <FlagFr /> },
  { code: "es", label: "Español", flag: <FlagEs /> },
  { code: "de", label: "Deutsch", flag: <FlagDe /> },
  { code: "pt", label: "Português", flag: <FlagPt /> },
  { code: "af", label: "Afrikaans", flag: <FlagZa /> },
  { code: "ar", label: "العربية", flag: <FlagAr /> },
];
