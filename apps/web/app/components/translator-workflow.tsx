"use client";

import { useEffect, useMemo, useState } from "react";
import { languages as footerLanguages } from "../lib/languages";
import { useTranslations } from "./language-provider";

type Language = {
  code: string;
  name: string;
  targets?: string[];
  available?: boolean;
};

const AUTO_LANGUAGE_CODE = "auto";

const allowedLanguages: Language[] = footerLanguages.map((lang) => ({
  code: lang.code,
  name: lang.label,
}));

const sortLanguages = (items: Language[]) =>
  [...items].sort((a, b) => a.name.localeCompare(b.name));

const buildTargetOptions = (source: string, languages: Language[]) => {
  const available = languages.filter((lang) => lang.available !== false);
  if (!available.length) return [];
  if (source === AUTO_LANGUAGE_CODE) return available;
  const sourceLang = available.find((lang) => lang.code === source);
  if (!sourceLang?.targets?.length) return available;
  return available.filter((lang) => sourceLang.targets?.includes(lang.code));
};

const pickDefaultTarget = (
  options: Language[],
  preferred: string,
  exclude?: string,
) => {
  if (!options.length) return preferred;
  if (preferred && preferred !== exclude) {
    const preferredMatch = options.find((lang) => lang.code === preferred);
    if (preferredMatch) return preferredMatch.code;
  }
  const fallback = options.find((lang) => lang.code !== exclude);
  return fallback?.code ?? options[0].code;
};

export function TranslatorWorkflow() {
  const t = useTranslations();
  const [languages, setLanguages] = useState<Language[]>(allowedLanguages);
  const [sourceLang, setSourceLang] = useState<string>(AUTO_LANGUAGE_CODE);
  const [targetLang, setTargetLang] = useState<string>("en");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const sortedLanguages = useMemo(
    () => sortLanguages(languages),
    [languages],
  );
  const targetOptions = useMemo(
    () => buildTargetOptions(sourceLang, sortedLanguages),
    [sourceLang, sortedLanguages],
  );
  const targetEnabledCodes = useMemo(
    () => new Set(targetOptions.map((lang) => lang.code)),
    [targetOptions],
  );
  const hasUnavailableLanguages = useMemo(
    () => sortedLanguages.some((lang) => lang.available === false),
    [sortedLanguages],
  );

  useEffect(() => {
    let active = true;
    const loadLanguages = async () => {
      try {
        const response = await fetch("/api/translate");
        const payload = (await response.json()) as Language[] | { error?: string };
        if (!response.ok) {
          const message =
            (payload as { error?: string })?.error ||
            t("translator.loadLanguagesError");
          throw new Error(message);
        }
        const list = Array.isArray(payload) ? payload : [];
        const availableByCode = new Map(
          list.map((lang) => [lang.code, lang]),
        );
        const merged = allowedLanguages.map((lang) => {
          const available = availableByCode.get(lang.code);
          return {
            ...lang,
            targets: available?.targets ?? [],
            available: Boolean(available),
          };
        });
        if (!active) return;
        setLanguages(merged);
        const defaultTarget = pickDefaultTarget(
          merged.filter((lang) => lang.available),
          "en",
        );
        setTargetLang(defaultTarget);
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error
            ? err.message
            : t("translator.loadLanguagesError");
        setError(message);
      }
    };

    loadLanguages();
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (!targetOptions.length) return;
    if (!targetOptions.some((lang) => lang.code === targetLang)) {
      const fallback = pickDefaultTarget(
        targetOptions,
        targetLang,
        sourceLang === AUTO_LANGUAGE_CODE ? undefined : sourceLang,
      );
      setTargetLang(fallback);
    }
  }, [targetOptions, targetLang, sourceLang]);

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError(t("translator.addTextError"));
      return;
    }
    if (!targetEnabledCodes.has(targetLang)) {
      setError(t("translator.selectTargetError"));
      return;
    }
    setIsTranslating(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: inputText,
          source: sourceLang,
          target: targetLang,
        }),
      });
      const payload = (await response.json()) as {
        translatedText?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || t("translator.translationFailed"));
      }
      setOutputText(payload.translatedText ?? "");
      setStatus(t("translator.translationComplete"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("translator.translationFailed");
      setError(message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwap = () => {
    const nextInput = outputText || inputText;
    const nextOutput = outputText ? inputText : "";
    if (sourceLang === AUTO_LANGUAGE_CODE) {
      const nextSource = targetLang;
      const nextTargets = buildTargetOptions(nextSource, sortedLanguages);
      const nextTarget = pickDefaultTarget(nextTargets, "en", nextSource);
      setSourceLang(nextSource);
      setTargetLang(nextTarget);
    } else {
      setSourceLang(targetLang);
      setTargetLang(sourceLang);
    }
    setInputText(nextInput);
    setOutputText(nextOutput);
  };

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setStatus(t("translator.copied"));
    } catch {
      setStatus(t("translator.copyFailed"));
    }
  };

  const inputHint = inputText.length
    ? t("translator.charactersCount", {
        count: inputText.length.toLocaleString(),
      })
    : t("translator.inputHintEmpty");
  const outputHint = outputText.length
    ? t("translator.charactersCount", {
        count: outputText.length.toLocaleString(),
      })
    : t("translator.outputHintEmpty");

  return (
    <div className="mt-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
              {t("translator.fromLabel")}
            </div>
            <select
              value={sourceLang}
              onChange={(event) => setSourceLang(event.target.value)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600 focus-visible:border-[var(--brand-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)]"
            >
              <option value={AUTO_LANGUAGE_CODE}>
                {t("translator.autoDetect")}
              </option>
              {sortedLanguages.map((lang) => (
                <option
                  key={lang.code}
                  value={lang.code}
                  disabled={lang.available === false}
                >
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder={t("translator.inputPlaceholder")}
            className="mt-3 h-44 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus-visible:border-[var(--brand-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)] dark:placeholder:text-[var(--muted-2)]"
          />
          <div className="mt-3 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
            {inputHint}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={handleSwap}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:text-[var(--foreground)] dark:focus-visible:ring-offset-[var(--background)]"
          >
            {t("translator.swap")}
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
              {t("translator.toLabel")}
            </div>
            <select
              value={targetLang}
              onChange={(event) => setTargetLang(event.target.value)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600 focus-visible:border-[var(--brand-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)]"
            >
              {sortedLanguages.map((lang) => (
                <option
                  key={lang.code}
                  value={lang.code}
                  disabled={!targetEnabledCodes.has(lang.code)}
                >
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={outputText}
            readOnly
            placeholder={t("translator.outputPlaceholder")}
            className="mt-3 h-44 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus-visible:border-[var(--brand-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-[var(--border-2)] dark:bg-[var(--surface-3)] dark:text-[var(--foreground)] dark:placeholder:text-[var(--muted-2)]"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
            <span>{outputHint}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-800 dark:border-[var(--border-2)] dark:text-[var(--muted-2)] dark:hover:border-[var(--border-1)] dark:hover:text-[var(--foreground)]"
            >
              {t("translator.copy")}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {status ? (
        <p className="mt-3 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
          {status}
        </p>
      ) : null}
      {hasUnavailableLanguages ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-[var(--muted-2)]">
          {t("translator.languagesUnavailableHint")}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleTranslate}
          disabled={isTranslating}
          className="inline-flex items-center rounded-full bg-[var(--brand-500)] px-5 py-2 text-sm font-semibold text-[var(--brand-on)] shadow-sm shadow-black/20 transition hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:shadow-black/40 dark:focus-visible:ring-offset-[var(--background)]"
        >
          {isTranslating
            ? t("translator.translating")
            : t("translator.translate")}
        </button>
      </div>
    </div>
  );
}
