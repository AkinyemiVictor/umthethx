"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "./language-provider";

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

const SCRIPT_ID = "google-translate-element-script";
const WIDGET_ID = "google_translate_element_footer";

const initializeGoogleTranslate = (elementId: string) => {
  if (typeof window === "undefined") return;

  const container = document.getElementById(elementId);
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
    elementId,
  );
  container.dataset.ready = "true";
};

export function GoogleTranslateWidget() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const init = () => initializeGoogleTranslate(WIDGET_ID);
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
      script.onload = init;
      document.body.appendChild(script);
    } else {
      script.addEventListener("load", init);
    }

    return () => {
      script?.removeEventListener("load", init);
      if (window.googleTranslateElementInit === init) {
        delete window.googleTranslateElementInit;
      }
    };
  }, []);

  return (
    <div className="google-translate-shell relative mt-3">
      {open ? (
        <button
          type="button"
          aria-hidden="true"
          className="fixed inset-0 z-10 cursor-default"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <button
        type="button"
        aria-label={t("footer.translateWithGoogle")}
        aria-expanded={open}
        aria-controls="google-translate-menu"
        onClick={() => setOpen((current) => !current)}
        className="relative z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--foreground)]"
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
        id="google-translate-menu"
        className={[
          "absolute left-0 top-full z-20 mt-2 w-[220px] max-w-[calc(100vw-3rem)] rounded-2xl border border-zinc-300 bg-white p-3 shadow-md shadow-black/10 transition dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-1 opacity-0",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          id={WIDGET_ID}
          className="min-h-[42px] rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-[var(--border-2)] dark:bg-[var(--surface-3)]"
        />
      </div>
    </div>
  );
}
