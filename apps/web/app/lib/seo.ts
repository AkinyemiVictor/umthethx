import type { Metadata } from "next";
import type { Converter } from "../../src/lib/converters";
import {
  converters,
  getConverterHref,
  getConverterPrimaryInput,
} from "../../src/lib/converters";
import {
  DEFAULT_MARKET,
  defaultHrefLang,
  marketHrefLangMap,
  prefixMarketPath,
  stripMarketPrefix,
  supportedMarkets,
  type MarketCode,
} from "../../src/lib/markets";

const DEFAULT_SITE_URL = "https://www.umthethx.online";
const DEFAULT_OG_IMAGE = "/apple-touch-icon.png";

const formatLabelMap: Record<string, string> = {
  avif: "AVIF",
  bmp: "BMP",
  csv: "CSV",
  doc: "DOC",
  docx: "Word",
  gif: "GIF",
  heic: "HEIC",
  heif: "HEIF",
  html: "HTML",
  image: "Image",
  jfif: "JFIF",
  jpeg: "JPEG",
  jpg: "JPG",
  json: "JSON",
  md: "Markdown",
  pdf: "PDF",
  png: "PNG",
  ppt: "PPT",
  pptx: "PowerPoint",
  svg: "SVG",
  tif: "TIFF",
  tiff: "TIFF",
  txt: "Text",
  webp: "WebP",
  xls: "Excel",
  xlsx: "Excel",
  xml: "XML",
};

const formatKeywordAliases: Record<string, string[]> = {
  avif: ["avif"],
  bmp: ["bmp"],
  csv: ["csv"],
  doc: ["doc", "word"],
  docx: ["word", "docx"],
  gif: ["gif"],
  heic: ["heic", "iphone photo"],
  heif: ["heif", "iphone photo"],
  html: ["html", "web page"],
  image: ["image", "photo", "picture"],
  jfif: ["jfif", "jpeg"],
  jpeg: ["jpeg", "jpg", "image"],
  jpg: ["jpg", "jpeg", "image"],
  json: ["json"],
  md: ["markdown"],
  pdf: ["pdf"],
  png: ["png", "image"],
  ppt: ["ppt", "powerpoint"],
  pptx: ["powerpoint", "pptx"],
  svg: ["svg"],
  tif: ["tif", "tiff"],
  tiff: ["tiff", "tif"],
  txt: ["text", "txt"],
  webp: ["webp", "image"],
  xls: ["excel", "xls"],
  xlsx: ["excel", "xlsx", "spreadsheet"],
  xml: ["xml"],
};

const normalizeSiteUrl = (value: string) => {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
};

const joinAsList = (items: string[]) => {
  if (items.length <= 1) {
    return items[0] ?? "";
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

const getConverterUseCase = (converter: Converter) => {
  if (converter.jobType === "ocr") {
    return "turning scanned text, screenshots, forms, and photographed pages into editable text";
  }

  if (
    converter.jobType === "extract" &&
    ["xlsx", "csv", "txt"].includes(converter.outputFormat)
  ) {
    return "pulling reusable tables, data, and text out of uploaded documents";
  }

  if (converter.outputFormat === "pdf") {
    return "creating a format that is easy to share, print, and archive";
  }

  if (converter.outputFormat === "docx") {
    return "turning static files into editable Word documents";
  }

  if (["jpg", "png", "html"].includes(converter.outputFormat)) {
    return "exporting files into a format that is simple to preview and share";
  }

  return "changing files into the format you need without installing desktop software";
};

const getDescriptionVerb = (converter: Converter, outputLabel: string) => {
  if (converter.jobType === "ocr") {
    return `Use OCR to extract editable ${outputLabel.toLowerCase()} from`;
  }

  if (converter.jobType === "extract") {
    return `Extract ${outputLabel.toLowerCase()} output from`;
  }

  return `Convert`;
};

export type SeoFaq = {
  question: string;
  answer: string;
};

export const siteName = "Umthethx";
export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL,
);

const ogImageUrl = new URL(DEFAULT_OG_IMAGE, `${siteUrl}/`).toString();

export const absoluteUrl = (path = "/") =>
  new URL(path, `${siteUrl}/`).toString();

export const getFormatLabel = (format: string) =>
  formatLabelMap[format.trim().toLowerCase()] ?? format.trim().toUpperCase();

const getFormatKeywordTerms = (format: string) =>
  formatKeywordAliases[format.trim().toLowerCase()] ?? [
    format.trim().toLowerCase(),
  ];

export const getSupportedFormatsLabel = (converter: Converter) =>
  joinAsList(converter.accept.extensions.map((format) => getFormatLabel(format)));

const dedupeKeywords = (keywords: readonly string[]) =>
  Array.from(new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean)));

export const defaultMetadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title: {
    default: `${siteName} | Online OCR Converter`,
    template: `%s | ${siteName}`,
  },
  description:
    "Free, ad-supported online file converter for images, documents, and more.",
  openGraph: {
    siteName,
    type: "website",
    images: [{ url: ogImageUrl }],
  },
  twitter: {
    card: "summary_large_image",
    images: [ogImageUrl],
  },
};

const buildHrefLangAlternates = (path: string) => {
  const { pathname } = stripMarketPrefix(path);
  const languages = Object.fromEntries(
    supportedMarkets.map((market) => [
      marketHrefLangMap[market],
      absoluteUrl(prefixMarketPath(pathname, market)),
    ]),
  );

  return {
    canonical: path,
    languages: {
      ...languages,
      [defaultHrefLang]: absoluteUrl(prefixMarketPath(pathname, DEFAULT_MARKET)),
    },
  };
};

export const buildMetadata = (input: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata => ({
  title: input.title,
  description: input.description,
  keywords: dedupeKeywords(input.keywords ?? []),
  alternates: buildHrefLangAlternates(input.path),
  openGraph: {
    title: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    siteName,
    type: "website",
    images: [{ url: ogImageUrl }],
  },
  twitter: {
    card: "summary_large_image",
    title: input.title,
    description: input.description,
    images: [ogImageUrl],
  },
});

export const getConverterSeoKeywords = (converter: Converter) => {
  const inputFormat = getConverterPrimaryInput(converter);
  const inputLabel = getFormatLabel(inputFormat);
  const outputFormat = converter.outputFormat;
  const outputLabel = getFormatLabel(outputFormat);
  const inputTerms = getFormatKeywordTerms(inputFormat).slice(0, 3);
  const outputTerms = getFormatKeywordTerms(outputFormat).slice(0, 3);
  const baseKeywords = [
    converter.title.toLowerCase(),
    `${converter.title.toLowerCase()} converter`,
    `free ${converter.title.toLowerCase()} converter`,
    `${converter.title.toLowerCase()} online`,
    `${inputLabel.toLowerCase()} to ${outputLabel.toLowerCase()}`,
    `convert ${inputLabel.toLowerCase()} to ${outputLabel.toLowerCase()}`,
  ];
  const patternKeywords = inputTerms.flatMap((fromTerm) =>
    outputTerms.flatMap((toTerm) => [
      `${fromTerm} to ${toTerm}`,
      `${fromTerm} to ${toTerm} converter`,
      `${fromTerm} to ${toTerm} converter free`,
      `${fromTerm} to ${toTerm} converter free online`,
      `${fromTerm} to ${toTerm} online`,
      `free ${fromTerm} to ${toTerm} converter`,
      `online ${fromTerm} to ${toTerm} converter`,
      `convert ${fromTerm} to ${toTerm}`,
      `convert ${fromTerm} to ${toTerm} online`,
      `convert ${fromTerm} to ${toTerm} free`,
    ]),
  );
  const intentKeywords: string[] = [];

  if (converter.jobType === "ocr") {
    intentKeywords.push(
      "online ocr",
      "online ocr converter",
      "extract text from image online",
      "image to text converter",
      "picture to text converter",
      "photo to text converter",
    );
  }

  if (converter.slug === "jpeg-to-text") {
    intentKeywords.push(
      "jpeg to text converter",
      "jpg to text converter",
      "extract text from jpg online",
      "extract text from jpeg online",
    );
  }

  if (converter.slug === "png-to-text") {
    intentKeywords.push(
      "png to text converter",
      "extract text from png online",
      "convert png to text online",
    );
  }

  if (converter.slug === "heic-to-text") {
    intentKeywords.push(
      "heic to text converter",
      "extract text from heic online",
      "convert heic to text online",
    );
  }

  if (converter.slug === "heif-to-text") {
    intentKeywords.push(
      "heif to text converter",
      "extract text from heif online",
      "convert heif to text online",
    );
  }

  if (converter.slug === "avif-to-text") {
    intentKeywords.push(
      "avif to text converter",
      "extract text from avif online",
      "convert avif to text online",
    );
  }

  if (converter.slug === "tiff-to-text") {
    intentKeywords.push(
      "tiff to text converter",
      "extract text from tiff online",
      "convert tiff to text online",
    );
  }

  if (converter.slug === "svg-to-text") {
    intentKeywords.push(
      "svg to text converter",
      "extract text from svg online",
      "convert svg to text online",
      "svg text extractor",
    );
  }

  if (converter.slug === "pdf-to-text") {
    intentKeywords.push(
      "pdf to text converter",
      "extract text from pdf online",
      "pdf text extractor",
    );
  }

  if (
    [
      "jpg-to-word",
      "png-to-document",
      "heic-to-word",
      "heif-to-word",
      "avif-to-docx",
      "tiff-to-word",
    ].includes(converter.slug)
  ) {
    intentKeywords.push(
      "image to word converter",
      "jpg to word converter free",
      "convert image to word online",
      "image to docx converter",
    );
  }

  if (converter.slug === "heic-to-word") {
    intentKeywords.push(
      "heic to word converter",
      "convert heic to word online",
      "heic to docx converter",
    );
  }

  if (converter.slug === "heif-to-word") {
    intentKeywords.push(
      "heif to word converter",
      "convert heif to word online",
      "heif to docx converter",
    );
  }

  if (converter.slug === "tiff-to-word") {
    intentKeywords.push(
      "tiff to word converter",
      "convert tiff to word online",
      "tiff to docx converter",
    );
  }

  if (converter.slug === "avif-to-docx") {
    intentKeywords.push(
      "avif to docx converter",
      "avif to word converter",
      "convert avif to docx online",
    );
  }

  if (converter.slug === "jpg-to-excel") {
    intentKeywords.push(
      "jpg to excel converter",
      "jpeg to excel converter",
      "convert jpg to excel online",
      "image to excel converter",
    );
  }

  if (converter.slug === "png-to-xlsx") {
    intentKeywords.push(
      "png to xlsx converter",
      "png to excel converter",
      "convert png to xlsx online",
      "extract table from png to excel",
    );
  }

  if (converter.slug === "avif-to-xlsx") {
    intentKeywords.push(
      "avif to xlsx converter",
      "avif to excel converter",
      "convert avif to xlsx online",
      "extract table from avif to excel",
    );
  }

  if (converter.slug === "heic-to-xlsx") {
    intentKeywords.push(
      "heic to xlsx converter",
      "heic to excel converter",
      "convert heic to xlsx online",
      "extract table from heic to excel",
    );
  }

  if (converter.slug === "heif-to-xlsx") {
    intentKeywords.push(
      "heif to xlsx converter",
      "heif to excel converter",
      "convert heif to xlsx online",
      "extract table from heif to excel",
    );
  }

  if (converter.slug === "tiff-to-xlsx") {
    intentKeywords.push(
      "tiff to xlsx converter",
      "tiff to excel converter",
      "convert tiff to xlsx online",
      "extract table from tiff to excel",
    );
  }

  if (converter.slug === "pdf-to-excel") {
    intentKeywords.push(
      "pdf to excel converter",
      "extract tables from pdf to excel",
      "pdf table to excel converter",
      "convert pdf to excel online",
    );
  }

  if (converter.slug === "pdf-to-xlsx") {
    intentKeywords.push(
      "pdf to xlsx converter",
      "convert pdf to xlsx online",
      "extract tables from pdf to xlsx",
      "pdf to spreadsheet converter",
      "free pdf to xlsx converter",
      "pdf table to xlsx converter",
      "pdf to excel spreadsheet online",
    );
  }

  if (converter.slug === "pdf-to-docx") {
    intentKeywords.push(
      "pdf to docx converter",
      "pdf to word converter",
      "convert pdf to docx online",
      "free pdf to docx converter",
      "convert pdf to editable word",
      "pdf to word document online",
      "pdf to editable docx",
    );
  }

  if (converter.slug === "pdf-to-csv") {
    intentKeywords.push(
      "pdf to csv converter",
      "extract data from pdf to csv",
      "convert pdf to csv online",
    );
  }

  if (converter.slug === "pdf-to-jpg") {
    intentKeywords.push(
      "pdf to jpg converter",
      "pdf to image converter",
      "convert pdf to jpg online",
    );
  }

  if (converter.slug === "pdf-to-jpeg") {
    intentKeywords.push(
      "pdf to jpeg converter",
      "pdf to image converter",
      "convert pdf to jpeg online",
      "pdf to jpeg free",
    );
  }

  if (converter.slug === "pdf-to-png") {
    intentKeywords.push(
      "pdf to png converter",
      "convert pdf to png online",
      "free pdf to png converter",
      "pdf pages to png",
    );
  }

  if (converter.slug === "pdf-to-tiff") {
    intentKeywords.push(
      "pdf to tiff converter",
      "convert pdf to tiff online",
      "free pdf to tif converter",
      "pdf pages to tiff",
    );
  }

  if (converter.slug === "pdf-to-heic") {
    intentKeywords.push(
      "pdf to heic converter",
      "convert pdf to heic online",
      "free pdf to heic converter",
    );
  }

  if (converter.slug === "pdf-to-heif") {
    intentKeywords.push(
      "pdf to heif converter",
      "convert pdf to heif online",
      "free pdf to heif converter",
    );
  }

  if (converter.slug === "pdf-to-avif") {
    intentKeywords.push(
      "pdf to avif converter",
      "convert pdf to avif online",
      "free pdf to avif converter",
    );
  }

  if (converter.slug === "jpg-to-pdf") {
    intentKeywords.push(
      "jpg to pdf converter",
      "jpeg to pdf converter",
      "convert jpg to pdf online",
      "jpg to pdf converter free",
    );
  }

  if (converter.slug === "heic-to-pdf") {
    intentKeywords.push(
      "heic to pdf converter",
      "convert heic to pdf online",
      "free heic to pdf converter",
    );
  }

  if (converter.slug === "heif-to-pdf") {
    intentKeywords.push(
      "heif to pdf converter",
      "convert heif to pdf online",
      "free heif to pdf converter",
    );
  }

  if (converter.slug === "png-to-pdf") {
    intentKeywords.push(
      "png to pdf converter",
      "convert png to pdf online",
      "free png to pdf converter",
      "png to pdf free",
    );
  }

  if (converter.slug === "avif-to-pdf") {
    intentKeywords.push(
      "avif to pdf converter",
      "convert avif to pdf online",
      "free avif to pdf converter",
    );
  }

  if (converter.slug === "webp-to-pdf") {
    intentKeywords.push(
      "webp to pdf converter",
      "convert webp to pdf online",
      "free webp to pdf converter",
    );
  }

  if (converter.slug === "svg-to-pdf") {
    intentKeywords.push(
      "svg to pdf converter",
      "convert svg to pdf online",
      "free svg to pdf converter",
      "svg to pdf free",
    );
  }

  if (converter.slug === "text-to-pdf") {
    intentKeywords.push(
      "text to pdf converter",
      "txt to pdf converter",
      "convert text to pdf online",
      "free text to pdf converter",
    );
  }

  if (converter.slug === "jpeg-to-avif") {
    intentKeywords.push(
      "jpeg to avif converter",
      "jpg to avif converter",
      "convert jpeg to avif online",
      "free jpeg to avif converter",
    );
  }

  if (converter.slug === "jpeg-to-heic") {
    intentKeywords.push(
      "jpeg to heic converter",
      "jpg to heic converter",
      "convert jpeg to heic online",
      "free jpeg to heic converter",
    );
  }

  if (converter.slug === "heif-to-jpeg") {
    intentKeywords.push(
      "heif to jpeg converter",
      "heif to jpg converter",
      "convert heif to jpeg online",
      "free heif to jpeg converter",
    );
  }

  if (converter.slug === "heif-to-png") {
    intentKeywords.push(
      "heif to png converter",
      "convert heif to png online",
      "free heif to png converter",
    );
  }

  if (converter.slug === "png-to-svg") {
    intentKeywords.push(
      "png to svg converter",
      "convert png to svg online",
      "free png to svg converter",
    );
  }

  if (converter.slug === "png-to-avif") {
    intentKeywords.push(
      "png to avif converter",
      "convert png to avif online",
      "free png to avif converter",
    );
  }

  if (converter.slug === "jpeg-to-svg") {
    intentKeywords.push(
      "jpeg to svg converter",
      "jpg to svg converter",
      "convert jpeg to svg online",
      "free jpeg to svg converter",
    );
  }

  if (converter.slug === "heic-to-svg") {
    intentKeywords.push(
      "heic to svg converter",
      "convert heic to svg online",
      "free heic to svg converter",
    );
  }

  if (converter.slug === "heic-to-avif") {
    intentKeywords.push(
      "heic to avif converter",
      "convert heic to avif online",
      "free heic to avif converter",
    );
  }

  if (converter.slug === "svg-to-png") {
    intentKeywords.push(
      "svg to png converter",
      "convert svg to png online",
      "free svg to png converter",
    );
  }

  if (converter.slug === "svg-to-jpeg") {
    intentKeywords.push(
      "svg to jpeg converter",
      "svg to jpg converter",
      "convert svg to jpeg online",
      "free svg to jpeg converter",
    );
  }

  if (converter.slug === "svg-to-heic") {
    intentKeywords.push(
      "svg to heic converter",
      "convert svg to heic online",
      "free svg to heic converter",
    );
  }

  if (converter.slug === "avif-to-jpeg") {
    intentKeywords.push(
      "avif to jpeg converter",
      "avif to jpg converter",
      "convert avif to jpeg online",
      "free avif to jpeg converter",
    );
  }

  if (converter.slug === "avif-to-png") {
    intentKeywords.push(
      "avif to png converter",
      "convert avif to png online",
      "free avif to png converter",
    );
  }

  if (converter.slug === "avif-to-heic") {
    intentKeywords.push(
      "avif to heic converter",
      "convert avif to heic online",
      "free avif to heic converter",
    );
  }

  if (converter.slug === "webp-to-jpeg") {
    intentKeywords.push(
      "webp to jpeg converter",
      "webp to jpg converter",
      "convert webp to jpeg online",
      "free webp to jpeg converter",
    );
  }

  if (converter.slug === "webp-to-png") {
    intentKeywords.push(
      "webp to png converter",
      "convert webp to png online",
      "free webp to png converter",
    );
  }

  if (converter.slug === "webp-to-svg") {
    intentKeywords.push(
      "webp to svg converter",
      "convert webp to svg online",
      "free webp to svg converter",
    );
  }

  if (converter.slug === "merge-pdf") {
    intentKeywords.push(
      "merge pdf online",
      "combine pdf files online",
      "pdf merger online",
    );
  }

  if (converter.slug === "split-pdf") {
    intentKeywords.push(
      "split pdf online",
      "extract pages from pdf",
      "pdf splitter online",
    );
  }

  return dedupeKeywords([
    ...baseKeywords,
    ...patternKeywords,
    ...intentKeywords,
    ...converter.categoryTags,
  ]);
};

export const getConverterSearchIntentLines = (converter: Converter) => {
  const phrases = getConverterSeoKeywords(converter).slice(0, 8);
  const firstBatch = phrases.slice(0, 4).map((phrase) => `"${phrase}"`);
  const secondBatch = phrases.slice(4, 8).map((phrase) => `"${phrase}"`);
  const lines = [
    `High-intent searches for this page include ${joinAsList(firstBatch)}.`,
  ];

  if (secondBatch.length) {
    lines.push(`Related searches also include ${joinAsList(secondBatch)}.`);
  }

  return lines;
};

export const getConverterMetadata = (
  converter: Converter,
  market: MarketCode = "global",
) => {
  const inputLabel = getFormatLabel(getConverterPrimaryInput(converter));
  const outputLabel = getFormatLabel(converter.outputFormat);
  const descriptionVerb = getDescriptionVerb(converter, outputLabel);
  let description =
    converter.jobType === "convert"
      ? `Free ${converter.title} converter online. Convert ${inputLabel} to ${outputLabel} in seconds and download the result without installing desktop software.`
      : `Free ${converter.title} converter online. ${descriptionVerb} ${inputLabel} files, upload ${getSupportedFormatsLabel(
          converter,
        )} documents, and download clean results in your browser.`;

  if (converter.slug === "pdf-to-docx") {
    description =
      "Free PDF to DOCX converter online. Convert PDF files into editable DOCX or Word documents in your browser and download the result in seconds.";
  }

  if (converter.slug === "pdf-to-xlsx") {
    description =
      "Free PDF to XLSX converter online. Extract PDF tables into editable XLSX spreadsheets and download the result without installing desktop software.";
  }

  return buildMetadata({
    title: `Free ${converter.title} Converter Online`,
    description,
    path: getConverterHref(converter, market),
    keywords: getConverterSeoKeywords(converter),
  });
};

export const getConverterHeroDescription = (converter: Converter) => {
  const inputLabel = getFormatLabel(getConverterPrimaryInput(converter));
  const outputLabel = getFormatLabel(converter.outputFormat);

  if (converter.slug === "pdf-to-docx") {
    return "Free PDF to DOCX converter online. Upload PDF files, extract editable text, and download a DOCX or Word document in seconds.";
  }

  if (converter.slug === "pdf-to-xlsx") {
    return "Free PDF to XLSX converter online. Upload PDF files, extract tables into spreadsheet rows, and download editable XLSX output in your browser.";
  }

  if (converter.jobType === "ocr") {
    return `Free ${converter.title} converter online. Upload ${inputLabel} files, run OCR in your browser, and download editable ${outputLabel.toLowerCase()} output in seconds.`;
  }

  if (converter.jobType === "extract") {
    return `Free ${converter.title} converter online. Upload ${inputLabel} files and extract reusable ${outputLabel.toLowerCase()} results for spreadsheets, reports, or searchable text.`;
  }

  return `Free ${converter.title} converter online. Upload ${inputLabel} files and download ${outputLabel} results without installing desktop software.`;
};

export const getConverterIntroParagraphs = (converter: Converter) => {
  const inputLabel = getFormatLabel(getConverterPrimaryInput(converter));
  const outputLabel = getFormatLabel(converter.outputFormat);
  const supportedFormats = getSupportedFormatsLabel(converter);

  if (converter.slug === "pdf-to-docx") {
    return [
      "PDF to DOCX is useful when you need to turn a PDF into an editable Word document for rewriting, updating formatting, or reusing content. Upload a PDF file, let Umthethx extract the text online, and download a DOCX file you can open in Microsoft Word or compatible editors.",
      "This page is tuned for high-intent searches such as pdf to docx converter, pdf to word converter, and convert pdf to editable word online, so the workflow is clear for both users and search engines.",
    ];
  }

  if (converter.slug === "pdf-to-xlsx") {
    return [
      "PDF to XLSX is built for extracting tables and structured data from PDF files into editable spreadsheet format. Upload a PDF, let Umthethx process the document online, and download an XLSX file for Excel or similar spreadsheet tools.",
      "This page targets high-intent searches such as pdf to xlsx converter, pdf to excel spreadsheet converter, and extract tables from pdf to xlsx online, which helps search engines understand the exact conversion task.",
    ];
  }

  return [
    `${converter.title} helps with ${getConverterUseCase(
      converter,
    )}. Upload ${supportedFormats} files, let Umthethx process the job online, and download the finished ${outputLabel} output from your browser.`,
    `This ${inputLabel} to ${outputLabel} workflow is useful when you need a quick conversion path without desktop tools. The page is focused on a single task, which makes it easier for users and search engines to understand exactly what the tool does.`,
  ];
};

export const getConverterBenefits = (converter: Converter) => {
  const inputLabel = getFormatLabel(getConverterPrimaryInput(converter));
  const outputLabel = getFormatLabel(converter.outputFormat);

  if (converter.slug === "pdf-to-docx") {
    return [
      "PDF to editable DOCX conversion in your browser",
      "Built for PDF to Word and PDF to DOCX workflows",
      "No desktop installation required",
    ];
  }

  if (converter.slug === "pdf-to-xlsx") {
    return [
      "PDF table extraction to editable XLSX spreadsheets",
      "Built for PDF to Excel and PDF to XLSX workflows",
      "No desktop installation required",
    ];
  }

  const items = [
    `${inputLabel} to ${outputLabel} conversion in your browser`,
    `Supports ${getSupportedFormatsLabel(converter)} uploads`,
    "No desktop installation required",
  ];

  if (converter.jobType === "ocr") {
    items[1] = "OCR-powered extraction for image-based text";
  }

  if (converter.jobType === "extract") {
    items[1] = `Built for extracting ${outputLabel.toLowerCase()} output from uploaded files`;
  }

  return items;
};

export const getConverterFaqs = (converter: Converter): SeoFaq[] => {
  const inputLabel = getFormatLabel(getConverterPrimaryInput(converter));
  const outputLabel = getFormatLabel(converter.outputFormat);
  const supportedFormats = getSupportedFormatsLabel(converter);

  if (converter.slug === "pdf-to-docx") {
    return [
      {
        question: "How do I convert PDF to DOCX online?",
        answer:
          "Upload your PDF file, start the PDF to DOCX workflow, and download the generated DOCX file after processing finishes.",
      },
      {
        question: "Does PDF to DOCX create an editable Word document?",
        answer:
          "Yes. This workflow is designed to turn PDF content into an editable DOCX file that can be opened in Word-compatible editors.",
      },
      {
        question: "Can I use this as a PDF to Word converter?",
        answer:
          "Yes. DOCX is the modern Microsoft Word document format, so this page also serves PDF to Word search intent.",
      },
      {
        question: "Is PDF to DOCX free to use online?",
        answer:
          "Yes. Umthethx provides an ad-supported PDF to DOCX workflow so you can convert files online without desktop software.",
      },
    ];
  }

  if (converter.slug === "pdf-to-xlsx") {
    return [
      {
        question: "How do I convert PDF to XLSX online?",
        answer:
          "Upload your PDF file, run the PDF to XLSX converter, and download the spreadsheet output when the extraction is complete.",
      },
      {
        question: "Does PDF to XLSX work for tables in a PDF?",
        answer:
          "Yes. This workflow is intended for pulling reusable table data from PDF documents into editable XLSX spreadsheet format.",
      },
      {
        question: "Can I use PDF to XLSX as a PDF to Excel converter?",
        answer:
          "Yes. XLSX is the standard Excel spreadsheet format, so this page covers both PDF to XLSX and PDF to Excel intent.",
      },
      {
        question: "Is PDF to XLSX free to use online?",
        answer:
          "Yes. Umthethx provides an ad-supported PDF to XLSX workflow so you can extract spreadsheet data online without desktop tools.",
      },
    ];
  }

  return [
    {
      question: `How do I use the ${converter.title} converter?`,
      answer: `Upload your ${inputLabel} file, start the ${converter.title} workflow, and download the ${outputLabel} result when processing finishes.`,
    },
    {
      question: `What file types work with ${converter.title}?`,
      answer: `${converter.title} accepts ${supportedFormats} files and returns ${outputLabel} output.`,
    },
    {
      question: `Is ${converter.title} free to use online?`,
      answer:
        "Yes. Umthethx provides an ad-supported workflow so you can convert files online without desktop software.",
    },
    {
      question: `Why use ${converter.title} in the browser?`,
      answer: `This page is focused on a single ${inputLabel} to ${outputLabel} workflow, which makes it faster to start the right conversion and easier to find through search.`,
    },
  ];
};

export const getRelatedConverters = (converter: Converter, limit = 4) => {
  const primaryInput = getConverterPrimaryInput(converter);

  return converters
    .filter((candidate) => candidate.slug !== converter.slug)
    .map((candidate) => {
      const sharedTags = candidate.categoryTags.filter((tag) =>
        converter.categoryTags.includes(tag),
      ).length;
      const score =
        sharedTags * 3 +
        Number(getConverterPrimaryInput(candidate) === primaryInput) +
        Number(candidate.outputFormat === converter.outputFormat) +
        Number(candidate.jobType === converter.jobType);

      return { candidate, score };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.candidate.title.localeCompare(right.candidate.title),
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate);
};

export const createBreadcrumbStructuredData = (
  items: Array<{ name: string; path: string }>,
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const createFaqStructuredData = (faqs: SeoFaq[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
});

export const createSoftwareApplicationStructuredData = (input: {
  name: string;
  path: string;
  description: string;
  featureList: string[];
  keywords?: string[];
}) => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: input.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description: input.description,
  featureList: input.featureList,
  keywords: input.keywords?.join(", "),
  url: absoluteUrl(input.path),
});
