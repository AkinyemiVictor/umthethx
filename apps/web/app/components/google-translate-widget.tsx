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

const SCRIPT_ID = "google-translate-element-script";
const WIDGET_ID = "google_translate_element_header";
const STORAGE_KEY = "umthethx_google_translate_language";
const RESET_EXPIRY = "Thu, 01 Jan 1970 00:00:00 GMT";

// Keep cookie writes centralized so resetting back to English is reliable.
const setGoogleTranslateCookie = (value: string | null) => {
  if (typeof window === "undefined") return;

  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  const rootDomain =
    parts.length >= 2 ? `.${parts.slice(-2).join(".")}` : hostname;

  const targets = [
    "",
    `domain=${hostname}; `,
    `domain=${rootDomain}; `,
  ];

  for (const prefix of targets) {
    if (value) {
      document.cookie = `googtrans=${value}; ${prefix}path=/; max-age=31536000; SameSite=Lax`;
    } else {
      document.cookie = `googtrans=; ${prefix}path=/; expires=${RESET_EXPIRY}; SameSite=Lax`;
    }
  }
};

// Hide Google’s injected banner/tooltip artifacts so translation stays unobtrusive.
const suppressGoogleTranslateArtifacts = () => {
  if (typeof window === "undefined") return;

  document.querySelectorAll<HTMLElement>(
    "iframe.goog-te-banner-frame, .goog-te-banner-frame, #goog-gt-tt, .goog-tooltip, .goog-tooltip:hover",
  ).forEach((node) => {
    node.style.display = "none";
    node.style.visibility = "hidden";
  });

  document.querySelectorAll<HTMLElement>(".goog-text-highlight").forEach((node) => {
    node.style.backgroundColor = "transparent";
    node.style.boxShadow = "none";
  });

  if (document.body) {
    document.body.style.top = "0px";
  }
};

// Add English back into the same Google select and persist the user choice.
const wireTranslateSelect = () => {
  if (typeof window === "undefined") return;

  const container = document.getElementById(WIDGET_ID);
  const select = container?.querySelector("select.goog-te-combo");
  if (!(select instanceof HTMLSelectElement)) {
    return;
  }

  if (!select.querySelector('option[value=""]')) {
    const english = document.createElement("option");
    english.value = "";
    english.textContent = "English";
    select.insertBefore(english, select.firstChild);
  }

  const saved = window.localStorage.getItem(STORAGE_KEY) ?? "en";
  if (saved === "en") {
    select.value = "";
  } else if (Array.from(select.options).some((option) => option.value === saved)) {
    setGoogleTranslateCookie(`/en/${saved}`);
    if (select.value !== saved) {
      select.value = saved;
      window.setTimeout(() => {
        select.dispatchEvent(new Event("change"));
      }, 0);
    }
  }

  if (select.dataset.umthethxBound === "true") {
    return;
  }

  select.addEventListener("change", () => {
    const next = select.value || "en";
    window.localStorage.setItem(STORAGE_KEY, next);

    if (next === "en") {
      setGoogleTranslateCookie(null);
      window.location.reload();
      return;
    }

    setGoogleTranslateCookie(`/en/${next}`);
    window.setTimeout(suppressGoogleTranslateArtifacts, 50);
  });

  select.dataset.umthethxBound = "true";
};

// Initialize the Google Website Translator element once its script is ready.
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

  window.setTimeout(() => {
    wireTranslateSelect();
    suppressGoogleTranslateArtifacts();
  }, 200);
};

export function GoogleTranslateWidget() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
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

    wireTranslateSelect();

    const observer = new MutationObserver(() => {
      wireTranslateSelect();
    });

    const container = document.getElementById(WIDGET_ID);
    if (container) {
      observer.observe(container, { childList: true, subtree: true });
    }

    const handlePointerDown = (event: MouseEvent) => {
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

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      observer.disconnect();
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <>
      <div ref={panelRef} className="relative z-30 flex items-center">
        <button
          type="button"
          aria-label="Toggle Google Translate"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm shadow-black/5 transition duration-200 hover:scale-[1.03] hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--foreground)] dark:shadow-none dark:focus-visible:ring-offset-[var(--background)] dark:hover:bg-[var(--surface-3)]"
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
            "absolute right-0 top-full mt-3 w-[260px] max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border border-zinc-300 bg-white/95 p-3 shadow-xl shadow-black/15 backdrop-blur transition-all duration-200 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-black/35",
            open
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-1 scale-95 opacity-0",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div id={WIDGET_ID} />
        </div>
      </div>

      <style jsx global>{`
        #${WIDGET_ID} .goog-te-gadget {
          display: block !important;
          color: inherit !important;
          font-family: inherit !important;
          font-size: 0.875rem !important;
          line-height: 1.25rem !important;
        }

        #${WIDGET_ID} .goog-te-gadget > span:last-child,
        #${WIDGET_ID} .goog-logo-link {
          display: none !important;
        }

        #${WIDGET_ID} .goog-te-combo {
          width: 100%;
          min-height: 42px;
          border: 1px solid rgb(212 212 216);
          border-radius: 0.875rem;
          background: #ffffff;
          color: #18181b;
          font: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.25rem;
          padding: 0 0.875rem;
          outline: none;
          appearance: auto;
          -webkit-appearance: menulist;
        }

        #${WIDGET_ID} .goog-te-combo option {
          color: #18181b;
          background: #ffffff;
        }

        .dark #${WIDGET_ID} .goog-te-combo {
          border-color: var(--border-2);
          background: var(--surface-3);
          color: var(--foreground);
        }

        .dark #${WIDGET_ID} .goog-te-combo option {
          color: var(--foreground);
          background: var(--surface-3);
        }

        .goog-te-banner-frame.skiptranslate {
          display: none !important;
        }

        #goog-gt-tt,
        .goog-tooltip,
        .goog-tooltip:hover,
        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
        }

        body {
          top: 0 !important;
        }
      `}</style>
    </>
  );
}
