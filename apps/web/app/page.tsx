import Image from "next/image";
import { FileChip } from "@repo/ui/file-chip";

type ConverterItem = {
  title: string;
  from: string;
  to: string;
  description: string;
};

const converters: ConverterItem[] = [
  {
    title: "Image to Text",
    from: "png",
    to: "txt",
    description: "Extract text from images.",
  },
  {
    title: "JPEG to PNG",
    from: "jpg",
    to: "png",
    description: "Swap formats without losing clarity.",
  },
  {
    title: "PNG to Document",
    from: "png",
    to: "docx",
    description: "Turn scans into editable docs.",
  },
  {
    title: "JPEG to PDF",
    from: "jpg",
    to: "pdf",
    description: "Bundle images into a PDF.",
  },
  {
    title: "PDF to DOCX",
    from: "pdf",
    to: "docx",
    description: "Edit PDF content in Word.",
  },
  {
    title: "CSV to JSON",
    from: "csv",
    to: "json",
    description: "Convert structured data quickly.",
  },
];

const supportedFormats = [
  "JPG",
  "JPEG",
  "PNG",
  "GIF",
  "JFIF",
  "HEIC",
  "WEBP",
  "AVIF",
  "SVG",
  "TIFF",
  "BMP",
  "PDF",
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 text-zinc-900 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 dark:text-zinc-50">
      <div className="pointer-events-none absolute -top-32 right-[-120px] h-72 w-72 rounded-full bg-orange-200/40 blur-3xl dark:bg-orange-500/10" />
      <div className="pointer-events-none absolute -bottom-28 left-[-80px] h-72 w-72 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo/Artboard 1.png"
              alt="Untetx logo"
              width={140}
              height={44}
              priority
            />
            <span className="sr-only">Untetx</span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            <details className="group relative">
              <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-orange-200 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10 dark:focus-visible:ring-offset-zinc-950">
                Converters
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4 text-orange-500"
                >
                  <path
                    d="M5 7.5 10 12.5 15 7.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </summary>
              <div className="absolute left-0 top-full z-20 mt-3 hidden w-[320px] rounded-2xl border border-orange-100 bg-white/95 p-3 shadow-lg shadow-orange-100/80 backdrop-blur group-open:block dark:border-orange-500/20 dark:bg-zinc-950/95 dark:shadow-none">
                <div className="grid gap-3">
                  {converters.map((converter) => (
                    <div
                      key={converter.title}
                      className="rounded-xl border border-zinc-200 bg-white/80 p-3 transition hover:border-orange-200 hover:bg-orange-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10"
                    >
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {converter.title}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <FileChip ext={converter.from} />
                        <span className="text-zinc-400">-&gt;</span>
                        <FileChip ext={converter.to} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </nav>
        </header>

        <section className="rounded-3xl border border-orange-100 bg-white/80 p-6 shadow-sm shadow-orange-100/80 backdrop-blur dark:border-orange-500/20 dark:bg-zinc-950/80 dark:shadow-none">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600 dark:text-orange-400">
              Image to Text
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Image to Text Converter
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Convert your images to text with fast, accurate extraction.
            </p>
          </div>
          <div className="mt-6 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/50 p-6 text-center shadow-sm shadow-orange-100/60 dark:border-orange-500/30 dark:bg-orange-500/5 dark:shadow-none">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 16V6" />
                <path d="M8 10l4-4 4 4" />
                <path d="M4 18h16" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Drop, upload, or paste images
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Supported formats: {supportedFormats.join(", ")} and more.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <label
                htmlFor="image-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-zinc-950 shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 active:bg-orange-700 active:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:shadow-orange-500/10 dark:focus-visible:ring-offset-zinc-950"
              >
                Browse
              </label>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                or drag and drop
              </span>
            </div>
            <input
              id="image-upload"
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="sr-only"
              aria-label="Upload images"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-orange-100 bg-white/70 p-6 shadow-sm shadow-orange-100/80 backdrop-blur dark:border-orange-500/20 dark:bg-zinc-950/80 dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Converters</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Choose a conversion and get started fast.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {converters.map((converter) => (
              <div
                key={converter.title}
                className="rounded-2xl border border-zinc-200 bg-white/80 p-4 transition hover:border-orange-200 hover:bg-orange-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10"
              >
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {converter.title}
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {converter.description}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <FileChip ext={converter.from} />
                  <span className="text-zinc-400">-&gt;</span>
                  <FileChip ext={converter.to} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
