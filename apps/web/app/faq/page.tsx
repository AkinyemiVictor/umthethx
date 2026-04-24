import type { Metadata } from "next";
import Link from "next/link";
import {
  getConverterBySlug,
  getConverterHref,
} from "../../src/lib/converters";
import { FaqComments } from "../components/faq-comments";
import { LegalPageShell } from "../components/legal-page-shell";
import { getCurrentMarket, prefixMarketPath } from "../lib/markets";
import {
  buildMetadata,
  createFaqStructuredData,
  getConverterFaqs,
  type SeoFaq,
} from "../lib/seo";

const homeFaqConverter = getConverterBySlug("image-to-text");

const siteFaqs: SeoFaq[] = [
  {
    question: "What is Umthethx?",
    answer:
      "Umthethx is an online, ad-supported set of tools for OCR, file conversion, and AI note making.",
  },
  {
    question: "Do I need to install software to use Umthethx?",
    answer:
      "No. You can upload files or paste text in your browser, run the workflow, and download the result when processing finishes.",
  },
  {
    question: "Which Umthethx tool should I start with?",
    answer:
      "Use Image to Text for OCR, choose a converter page for a specific file-format change, and use AI Notemaker when you want notes from long text.",
  },
  {
    question: "How do I contact Umthethx support?",
    answer:
      "Use the Contact Us page or email contactumthethx@gmail.com if you need help, want to report a bug, or have feedback.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const market = await getCurrentMarket();

  return buildMetadata({
    title: "FAQ",
    description:
      "Answers to common questions about Umthethx OCR, file conversion, and support.",
    path: prefixMarketPath("/faq", market),
    keywords: [
      "umthethx faq",
      "ocr faq",
      "file converter faq",
      "image to text faq",
    ],
  });
}

export default async function FaqPage() {
  const market = await getCurrentMarket();
  const hiddenConverterFaqs = homeFaqConverter
    ? getConverterFaqs(homeFaqConverter)
    : [];
  const imageToTextHref = homeFaqConverter
    ? getConverterHref(homeFaqConverter, market)
    : prefixMarketPath("/ocr", market);
  const contactHref = prefixMarketPath("/contact", market);

  return (
    <>
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            createFaqStructuredData([...siteFaqs, ...hiddenConverterFaqs]),
          ),
        }}
        type="application/ld+json"
      />

      <LegalPageShell
        title="FAQ"
        description="Answers to common questions about Umthethx and our image-to-text tools."
      >
        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
            Common questions
          </h2>
          <div className="mt-4 space-y-4">
            {siteFaqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none"
              >
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                  {faq.question}
                </h3>
                <p className="mt-2">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
            Image to Text converter FAQ
          </h2>
          <p className="mt-2">
            These are the converter-specific questions already embedded in the
            homepage experience, now exposed on a dedicated page as well.
          </p>
          <div className="mt-4">
            <Link
              href={imageToTextHref}
              className="font-semibold text-[#0000ff] underline decoration-[#6b7cff] underline-offset-4 transition hover:text-[#0000e6] dark:text-[#4a6cff] dark:decoration-[#4a6cff] dark:hover:text-[#7f96ff]"
            >
              Open Image to Text converter
            </Link>
          </div>

          <div className="mt-4 space-y-4">
            {hiddenConverterFaqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-black/10 dark:border-[var(--border-2)] dark:bg-[var(--surface-2)] dark:shadow-none"
              >
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">
                  {faq.question}
                </h3>
                <p className="mt-2">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <FaqComments />

        <section>
          <p>
            Need help with something not covered here? Reach out directly.
          </p>
          <div className="mt-3">
            <Link
              href={contactHref}
              className="font-semibold text-[#0000ff] underline decoration-[#6b7cff] underline-offset-4 transition hover:text-[#0000e6] dark:text-[#4a6cff] dark:decoration-[#4a6cff] dark:hover:text-[#7f96ff]"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </LegalPageShell>
    </>
  );
}
