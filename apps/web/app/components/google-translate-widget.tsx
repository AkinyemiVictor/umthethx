"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: {
          new (
            options: {
              pageLanguage: string;
              autoDisplay?: boolean;
            },
            elementId: string,
          ): unknown;
        };
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

type LanguageOption = {
  code: string;
  label: string;
};

const SCRIPT_ID = "google-translate-element-script";
const WIDGET_ID = "google_translate_element_header";
const STORAGE_KEY = "umthethx_google_translate_language";
const RESET_EXPIRY = "Thu, 01 Jan 1970 00:00:00 GMT";
const DEFAULT_LANGUAGE = "en";

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "af", label: "Afrikaans" },
  { code: "ar", label: "Arabic" },
  { code: "bn", label: "Bengali" },
  { code: "zh-CN", label: "Chinese (Simplified)" },
  { code: "zh-TW", label: "Chinese (Traditional)" },
  { code: "nl", label: "Dutch" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "el", label: "Greek" },
  { code: "gu", label: "Gujarati" },
  { code: "ha", label: "Hausa" },
  { code: "hi", label: "Hindi" },
  { code: "ig", label: "Igbo" },
  { code: "id", label: "Indonesian" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "pt", label: "Portuguese" },
  { code: "nso", label: "Sepedi" },
  { code: "ru", label: "Russian" },
  { code: "es", label: "Spanish" },
  { code: "st", label: "Sotho" },
  { code: "nr", label: "Southern Ndebele" },
  { code: "sw", label: "Swahili" },
  { code: "ss", label: "Swazi" },
  { code: "tr", label: "Turkish" },
  { code: "ts", label: "Tsonga" },
  { code: "tn", label: "Tswana" },
  { code: "uk", label: "Ukrainian" },
  { code: "ur", label: "Urdu" },
  { code: "ve", label: "Venda" },
  { code: "vi", label: "Vietnamese" },
  { code: "xh", label: "Xhosa" },
  { code: "yo", label: "Yoruba" },
  { code: "zu", label: "Zulu" },
];

const setGoogleTranslateCookie = (value: string | null) => {
  if (typeof window === "undefined") return;

  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  const rootDomain =
    parts.length >= 2 ? `.${parts.slice(-2).join(".")}` : hostname;

  const targets = ["", `domain=${hostname}; `, `domain=${rootDomain}; `];

  for (const prefix of targets) {
    if (value) {
      document.cookie = `googtrans=${value}; ${prefix}path=/; max-age=31536000; SameSite=Lax`;
    } else {
      document.cookie = `googtrans=; ${prefix}path=/; expires=${RESET_EXPIRY}; SameSite=Lax`;
    }
  }
};

const suppressGoogleTranslateArtifacts = () => {
  if (typeof window === "undefined") return;

  document.querySelectorAll<HTMLElement>(
    [
      "iframe.goog-te-banner-frame",
      ".goog-te-banner-frame",
      "body > .skiptranslate",
      "body > iframe.skiptranslate",
      "body > [class*='VIpgJd-ZVi9od']",
      "iframe[class*='VIpgJd-ZVi9od']",
      "#goog-gt-tt",
      ".goog-tooltip",
      ".goog-tooltip:hover",
    ].join(", "),
  ).forEach((node) => {
    node.style.display = "none";
    node.style.visibility = "hidden";
  });

  document.querySelectorAll<HTMLElement>(".goog-text-highlight").forEach((node) => {
    node.style.backgroundColor = "transparent";
    node.style.boxShadow = "none";
  });

  if (document.documentElement) {
    document.documentElement.style.top = "0px";
    document.documentElement.style.marginTop = "0px";
  }

  if (document.body) {
    document.body.style.top = "0px";
  }
};

const initializeGoogleTranslate = () => {
  if (typeof window === "undefined") return;

  const container = document.getElementById(WIDGET_ID);
  const TranslateElement = window.google?.translate?.TranslateElement;

  if (!container || !TranslateElement || container.dataset.ready === "true") {
    return;
  }

  container.innerHTML = "";
  new TranslateElement(
    {
      pageLanguage: "en",
      autoDisplay: false,
    },
    WIDGET_ID,
  );
  container.dataset.ready = "true";

  window.setTimeout(suppressGoogleTranslateArtifacts, 100);
  window.setTimeout(suppressGoogleTranslateArtifacts, 500);
  window.setTimeout(suppressGoogleTranslateArtifacts, 1500);
};

export function GoogleTranslateWidget() {
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedLanguage =
      window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_LANGUAGE;

    setSelectedLanguage(savedLanguage);

    if (savedLanguage === "en") {
      setGoogleTranslateCookie(null);
    } else {
      setGoogleTranslateCookie(`/en/${savedLanguage}`);
    }

    const init = () => initializeGoogleTranslate();
    window.googleTranslateElementInit = init;

    if (window.google?.translate?.TranslateElement) {
      init();
      return () => {
        if (window.googleTranslateElementInit === init) {
          delete window.googleTranslateElementInit;
        }
      };
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      if (window.googleTranslateElementInit === init) {
        delete window.googleTranslateElementInit;
      }
    };
  }, []);

  useEffect(() => {
    suppressGoogleTranslateArtifacts();

    const observer = new MutationObserver(() => {
      suppressGoogleTranslateArtifacts();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        panelRef.current &&
        event.target instanceof Node &&
        !panelRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const applyLanguage = (nextLanguage: string) => {
    setSelectedLanguage(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);

    if (nextLanguage === "en") {
      setGoogleTranslateCookie(null);
    } else {
      setGoogleTranslateCookie(`/en/${nextLanguage}`);
    }

    window.location.reload();
  };

  return (
    <>
      <div
        id={WIDGET_ID}
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0"
      />

      <div ref={panelRef} className="relative z-30 flex items-center">
        <button
          type="button"
          aria-label="Toggle Google Translate"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className={[
            "inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white text-zinc-700 shadow-sm shadow-black/5 transition duration-200",
            "hover:scale-[1.03] hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
            "dark:bg-[var(--surface-2)] dark:text-[var(--foreground)] dark:shadow-none dark:focus-visible:ring-offset-[var(--background)] dark:hover:bg-[var(--surface-3)]",
            open
              ? "border-[var(--brand-400)] bg-[var(--brand-50)]"
              : "border-zinc-200 dark:border-[var(--border-2)]",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="currentColor"
          >
            <path d="M12.87 15.07 10.33 12.56l.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17c-.67 1.92-1.73 3.75-3.17 5.35A17.7 17.7 0 0 1 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04ZM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12ZM15.88 17l1.62-4.33L19.12 17h-3.24Z" />
          </svg>
        </button>

        <div
          className={[
            "absolute right-0 top-full z-40 mt-3 w-[244px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-xl shadow-black/12 backdrop-blur dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-black/30",
            open ? "block" : "hidden",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-[var(--muted-2)]">
            Translate Page
          </div>
          <label htmlFor="google-translate-language" className="sr-only">
            Translate page
          </label>
          <div className="relative">
            <select
              id="google-translate-language"
              value={selectedLanguage}
              onChange={(event) => applyLanguage(event.target.value)}
              className="w-full appearance-none rounded-full border border-zinc-200 bg-white px-4 py-2.5 pr-11 text-sm font-semibold text-zinc-900 shadow-sm shadow-black/5 outline-none transition focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-ring)] dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)]"
            >
              {LANGUAGE_OPTIONS.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-zinc-400 dark:text-[var(--muted-2)]">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 7.5 10 12.5 15 7.5" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .goog-te-banner-frame.skiptranslate,
        body > .skiptranslate,
        body > iframe.skiptranslate,
        body > [class*="VIpgJd-ZVi9od"],
        iframe[class*="VIpgJd-ZVi9od"] {
          display: none !important;
          visibility: hidden !important;
        }

        #goog-gt-tt,
        .goog-tooltip,
        .goog-tooltip:hover,
        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
        }

        html {
          top: 0 !important;
          margin-top: 0 !important;
        }

        body {
          top: 0 !important;
        }
      `}</style>
    </>
  );
}
