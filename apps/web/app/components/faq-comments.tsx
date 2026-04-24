"use client";

import { FormEvent, useEffect, useState } from "react";

type FaqComment = {
  id: string;
  name: string;
  body: string;
  createdAt: string;
};

type FormFeedback =
  | { kind: "error"; message: string }
  | { kind: "success"; message: string }
  | null;

const STORAGE_KEY = "umthethx-faq-comments";
const logoBlueButtonClassName =
  "rounded-full bg-[#0000ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0000e6] active:bg-[#0000cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,0,255,0.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-[#4a6cff] dark:hover:bg-[#3c5df0] dark:active:bg-[#2f4ce0] dark:focus-visible:ring-[rgba(74,108,255,0.45)] dark:focus-visible:ring-offset-[var(--background)]";

const formatCommentDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const parseStoredComments = (value: string | null): FaqComment[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is FaqComment =>
          typeof item === "object" &&
          item !== null &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.body === "string" &&
          typeof item.createdAt === "string",
      )
      .slice(0, 50);
  } catch {
    return [];
  }
};

export function FaqComments() {
  const [comments, setComments] = useState<FaqComment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [feedback, setFeedback] = useState<FormFeedback>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const stored = parseStoredComments(window.localStorage.getItem(STORAGE_KEY));
    setComments(stored);
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  }, [comments, hasLoaded]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedBody = body.trim();

    if (!trimmedBody) {
      setFeedback({
        kind: "error",
        message: "Write a comment before posting.",
      });
      return;
    }

    const nextComment: FaqComment = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`,
      name: trimmedName || "Anonymous",
      body: trimmedBody,
      createdAt: new Date().toISOString(),
    };

    setComments((current) => [nextComment, ...current].slice(0, 50));
    setName("");
    setBody("");
    setFeedback({
      kind: "success",
      message:
        "Comment saved in this browser. Wire a backend later if you want public comments.",
    });
  };

  const commentCountLabel =
    comments.length === 1 ? "1 comment" : `${comments.length} comments`;

  return (
    <section>
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          Comments
        </h2>
        <p>
          Leave a note or follow-up question about this FAQ. This first version
          stores comments in the current browser only.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="faq-comment-name"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-[var(--muted-2)]"
              >
                Name
              </label>
              <input
                id="faq-comment-name"
                type="text"
                value={name}
                maxLength={40}
                onChange={(event) => setName(event.target.value)}
                placeholder="Anonymous"
                className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-[var(--border-2)] dark:bg-[var(--surface-1)] dark:text-[var(--foreground)]"
              />
            </div>

            <div>
              <label
                htmlFor="faq-comment-body"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-[var(--muted-2)]"
              >
                Comment
              </label>
              <textarea
                id="faq-comment-body"
                value={body}
                maxLength={500}
                rows={6}
                onChange={(event) => setBody(event.target.value)}
                placeholder="What else should this FAQ answer?"
                className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-[var(--border-2)] dark:bg-[var(--surface-1)] dark:text-[var(--foreground)]"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p
                className={`text-xs ${
                  feedback?.kind === "error"
                    ? "text-red-600 dark:text-red-400"
                    : "text-zinc-500 dark:text-[var(--muted-2)]"
                }`}
              >
                {feedback?.message ?? "Keep comments respectful and relevant."}
              </p>
              <button
                type="submit"
                className={logoBlueButtonClassName}
              >
                Post comment
              </button>
            </div>
          </div>
        </form>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
              Recent comments
            </h3>
            <span className="text-xs text-zinc-500 dark:text-[var(--muted-2)]">
              {hasLoaded ? commentCountLabel : "Loading comments..."}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {hasLoaded && comments.length ? (
              comments.map((comment) => (
                <article
                  key={comment.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-[var(--border-2)] dark:bg-[var(--surface-1)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                      {comment.name}
                    </p>
                    <time className="text-xs text-zinc-500 dark:text-[var(--muted-2)]">
                      {formatCommentDate(comment.createdAt)}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-[var(--muted)]">
                    {comment.body}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm text-zinc-600 dark:border-[var(--border-2)] dark:bg-[var(--surface-1)] dark:text-[var(--muted)]">
                No comments yet. Add the first one from this browser.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
