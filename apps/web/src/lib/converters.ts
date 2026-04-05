import { prefixMarketPath, type MarketCode } from "./markets";

export type ConverterJobType = "ocr" | "extract" | "convert";

export type ConverterAccept = {
  extensions: string[];
  mimeTypes: string[];
};

export type ConverterDefinition = {
  slug: string;
  title: string;
  description: string;
  categoryTags: string[];
  accept: ConverterAccept;
  outputFormat: string;
  jobType: ConverterJobType;
  engineHint: string;
  isHomeFeatured: boolean;
};

export type Converter = ConverterDefinition;

export type ConverterCategoryIcon =
  | "image-doc"
  | "image-format"
  | "image-pdf"
  | "doc-image"
  | "doc-convert"
  | "pdf-tools"
  | "scan-code"
  | "data-tools"
  | "more";

export type ConverterCategory = {
  title: string;
  description: string;
  icon: ConverterCategoryIcon;
  converterSlugs: string[];
};

export type ConverterCategoryGroup = {
  title: string;
  description: string;
  icon: ConverterCategoryIcon;
  items: Converter[];
};

const normalizeValue = (value: string) => value.trim().toLowerCase();

const uniqueValues = (values: string[]) =>
  Array.from(
    new Set(values.map((value) => normalizeValue(value)).filter(Boolean)),
  );

const mimeByExtension: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx:
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx:
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  csv: "text/csv",
  txt: "text/plain",
  md: "text/markdown",
  html: "text/html",
  json: "application/json",
  xml: "application/xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  jfif: "image/jpeg",
  svg: "image/svg+xml",
  webp: "image/webp",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  tif: "image/tiff",
  tiff: "image/tiff",
  bmp: "image/bmp",
};

const buildAccept = (
  extensions: string[],
  extraMimeTypes: string[] = [],
): ConverterAccept => {
  const normalizedExtensions = uniqueValues(extensions);
  const derivedMimeTypes = normalizedExtensions
    .map((ext) => mimeByExtension[ext])
    .filter((mime): mime is string => Boolean(mime));
  const mimeTypes = uniqueValues([...extraMimeTypes, ...derivedMimeTypes]);
  return { extensions: normalizedExtensions, mimeTypes };
};

const commonImageExtensions = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "jfif",
  "svg",
  "webp",
  "avif",
  "heic",
  "heif",
  "tif",
  "tiff",
  "bmp",
];

const imageAccept = buildAccept(commonImageExtensions, ["image/*"]);

const defineConverter = (data: {
  slug: string;
  title: string;
  description: string;
  categoryTags: string[];
  acceptExtensions: string[];
  acceptMimeTypes?: string[];
  outputFormat: string;
  jobType: ConverterJobType;
  engineHint: string;
  isHomeFeatured?: boolean;
}): ConverterDefinition => ({
  slug: data.slug,
  title: data.title,
  description: data.description,
  categoryTags: data.categoryTags,
  accept: buildAccept(data.acceptExtensions, data.acceptMimeTypes ?? []),
  outputFormat: data.outputFormat,
  jobType: data.jobType,
  engineHint: data.engineHint,
  isHomeFeatured: data.isHomeFeatured ?? false,
});

export const converters: ConverterDefinition[] = [
  {
    slug: "image-to-text",
    title: "Image to Text",
    description: "Extract text from images.",
    categoryTags: ["image", "ocr", "text"],
    accept: imageAccept,
    outputFormat: "txt",
    jobType: "ocr",
    engineHint: "tesseract",
    isHomeFeatured: true,
  },
  defineConverter({
    slug: "jpeg-to-text",
    title: "JPEG to Text",
    description: "OCR text from JPEGs.",
    categoryTags: ["image", "ocr", "text"],
    acceptExtensions: ["jpeg", "jpg"],
    outputFormat: "txt",
    jobType: "ocr",
    engineHint: "tesseract",
  }),
  defineConverter({
    slug: "png-to-text",
    title: "PNG to Text",
    description: "Extract text from PNG files.",
    categoryTags: ["image", "ocr", "text"],
    acceptExtensions: ["png"],
    outputFormat: "txt",
    jobType: "ocr",
    engineHint: "tesseract",
  }),
  defineConverter({
    slug: "heic-to-text",
    title: "HEIC to Text",
    description: "Extract text from HEIC images.",
    categoryTags: ["image", "ocr", "text"],
    acceptExtensions: ["heic"],
    outputFormat: "txt",
    jobType: "ocr",
    engineHint: "tesseract",
  }),
  defineConverter({
    slug: "heif-to-text",
    title: "HEIF to Text",
    description: "Extract text from HEIF images.",
    categoryTags: ["image", "ocr", "text"],
    acceptExtensions: ["heif"],
    outputFormat: "txt",
    jobType: "ocr",
    engineHint: "tesseract",
  }),
  defineConverter({
    slug: "avif-to-text",
    title: "AVIF to Text",
    description: "Extract text from AVIF images.",
    categoryTags: ["image", "ocr", "text"],
    acceptExtensions: ["avif"],
    outputFormat: "txt",
    jobType: "ocr",
    engineHint: "tesseract",
  }),
  defineConverter({
    slug: "tiff-to-text",
    title: "TIFF to Text",
    description: "Extract text from TIFF files.",
    categoryTags: ["image", "ocr", "text"],
    acceptExtensions: ["tiff", "tif"],
    outputFormat: "txt",
    jobType: "ocr",
    engineHint: "tesseract",
  }),
  defineConverter({
    slug: "svg-to-text",
    title: "SVG to Text",
    description: "Extract text from SVG graphics.",
    categoryTags: ["image", "ocr", "text"],
    acceptExtensions: ["svg"],
    outputFormat: "txt",
    jobType: "ocr",
    engineHint: "svg-text",
  }),
  defineConverter({
    slug: "pdf-to-text",
    title: "PDF to Text",
    description: "Extract selectable text from PDFs.",
    categoryTags: ["pdf", "text", "extract"],
    acceptExtensions: ["pdf"],
    outputFormat: "txt",
    jobType: "extract",
    engineHint: "pdf-text-extract",
  }),
  defineConverter({
    slug: "jpg-to-word",
    title: "JPG to Word",
    description: "Convert images into editable Word docs.",
    categoryTags: ["image", "doc", "convert"],
    acceptExtensions: ["jpg", "jpeg"],
    outputFormat: "docx",
    jobType: "convert",
    engineHint: "ocr-docx",
  }),
  defineConverter({
    slug: "heic-to-word",
    title: "HEIC to Word",
    description: "Convert HEIC images into editable Word docs.",
    categoryTags: ["image", "doc", "convert"],
    acceptExtensions: ["heic"],
    outputFormat: "docx",
    jobType: "convert",
    engineHint: "ocr-docx",
  }),
  defineConverter({
    slug: "heif-to-word",
    title: "HEIF to Word",
    description: "Convert HEIF images into editable Word docs.",
    categoryTags: ["image", "doc", "convert"],
    acceptExtensions: ["heif"],
    outputFormat: "docx",
    jobType: "convert",
    engineHint: "ocr-docx",
  }),
  defineConverter({
    slug: "avif-to-docx",
    title: "AVIF to DOCX",
    description: "Convert AVIF images into editable DOCX files.",
    categoryTags: ["image", "doc", "convert"],
    acceptExtensions: ["avif"],
    outputFormat: "docx",
    jobType: "convert",
    engineHint: "ocr-docx",
  }),
  defineConverter({
    slug: "tiff-to-word",
    title: "TIFF to Word",
    description: "Turn TIFF scans into editable Word docs.",
    categoryTags: ["image", "doc", "convert"],
    acceptExtensions: ["tiff", "tif"],
    outputFormat: "docx",
    jobType: "convert",
    engineHint: "ocr-docx",
  }),
  defineConverter({
    slug: "jpg-to-excel",
    title: "JPG to Excel",
    description: "Turn tables into spreadsheets.",
    categoryTags: ["image", "spreadsheet", "convert"],
    acceptExtensions: ["jpg", "jpeg"],
    outputFormat: "xlsx",
    jobType: "convert",
    engineHint: "ocr-xlsx",
  }),
  defineConverter({
    slug: "png-to-xlsx",
    title: "PNG to XLSX",
    description: "Turn PNG tables into spreadsheets.",
    categoryTags: ["image", "spreadsheet", "convert"],
    acceptExtensions: ["png"],
    outputFormat: "xlsx",
    jobType: "convert",
    engineHint: "ocr-xlsx",
  }),
  defineConverter({
    slug: "avif-to-xlsx",
    title: "AVIF to XLSX",
    description: "Turn AVIF tables into spreadsheets.",
    categoryTags: ["image", "spreadsheet", "convert"],
    acceptExtensions: ["avif"],
    outputFormat: "xlsx",
    jobType: "convert",
    engineHint: "ocr-xlsx",
  }),
  defineConverter({
    slug: "heic-to-xlsx",
    title: "HEIC to XLSX",
    description: "Turn HEIC tables into spreadsheets.",
    categoryTags: ["image", "spreadsheet", "convert"],
    acceptExtensions: ["heic"],
    outputFormat: "xlsx",
    jobType: "convert",
    engineHint: "ocr-xlsx",
  }),
  defineConverter({
    slug: "heif-to-xlsx",
    title: "HEIF to XLSX",
    description: "Turn HEIF tables into spreadsheets.",
    categoryTags: ["image", "spreadsheet", "convert"],
    acceptExtensions: ["heif"],
    outputFormat: "xlsx",
    jobType: "convert",
    engineHint: "ocr-xlsx",
  }),
  defineConverter({
    slug: "tiff-to-xlsx",
    title: "TIFF to XLSX",
    description: "Turn TIFF tables into spreadsheets.",
    categoryTags: ["image", "spreadsheet", "convert"],
    acceptExtensions: ["tiff", "tif"],
    outputFormat: "xlsx",
    jobType: "convert",
    engineHint: "ocr-xlsx",
  }),
  defineConverter({
    slug: "pdf-to-excel",
    title: "PDF to Excel",
    description: "Extract tables into Excel.",
    categoryTags: ["pdf", "spreadsheet", "extract"],
    acceptExtensions: ["pdf"],
    outputFormat: "xlsx",
    jobType: "extract",
    engineHint: "pdf-table-extract",
    isHomeFeatured: true,
  }),
  defineConverter({
    slug: "pdf-to-xlsx",
    title: "PDF to XLSX",
    description: "Extract tables into XLSX spreadsheets.",
    categoryTags: ["pdf", "spreadsheet", "extract"],
    acceptExtensions: ["pdf"],
    outputFormat: "xlsx",
    jobType: "extract",
    engineHint: "pdf-table-extract",
  }),
  defineConverter({
    slug: "pdf-to-docx",
    title: "PDF to DOCX",
    description: "Convert PDF text into editable DOCX documents.",
    categoryTags: ["pdf", "doc", "convert"],
    acceptExtensions: ["pdf"],
    outputFormat: "docx",
    jobType: "convert",
    engineHint: "pdf-docx",
  }),
  defineConverter({
    slug: "word-to-pdf",
    title: "Word to PDF",
    description: "Share documents as PDF.",
    categoryTags: ["doc", "pdf", "convert"],
    acceptExtensions: ["docx"],
    outputFormat: "pdf",
    jobType: "convert",
    engineHint: "libreoffice",
    isHomeFeatured: true,
  }),
  defineConverter({
    slug: "text-to-pdf",
    title: "Text to PDF",
    description: "Convert plain text files into PDF documents.",
    categoryTags: ["text", "pdf", "convert"],
    acceptExtensions: ["txt"],
    outputFormat: "pdf",
    jobType: "convert",
    engineHint: "libreoffice",
  }),
  defineConverter({
    slug: "pdf-to-jpg",
    title: "PDF to JPG",
    description: "Export pages as images.",
    categoryTags: ["pdf", "image", "convert"],
    acceptExtensions: ["pdf"],
    outputFormat: "jpg",
    jobType: "convert",
    engineHint: "pdf-image",
    isHomeFeatured: true,
  }),
  defineConverter({
    slug: "pdf-to-jpeg",
    title: "PDF to JPEG",
    description: "Export PDF pages as JPEG images.",
    categoryTags: ["pdf", "image", "convert"],
    acceptExtensions: ["pdf"],
    outputFormat: "jpeg",
    jobType: "convert",
    engineHint: "pdf-image",
  }),
  defineConverter({
    slug: "pdf-to-png",
    title: "PDF to PNG",
    description: "Export PDF pages as PNG images.",
    categoryTags: ["pdf", "image", "convert"],
    acceptExtensions: ["pdf"],
    outputFormat: "png",
    jobType: "convert",
    engineHint: "pdf-image",
  }),
  defineConverter({
    slug: "pdf-to-tiff",
    title: "PDF to TIFF",
    description: "Export PDF pages as TIFF images.",
    categoryTags: ["pdf", "image", "convert"],
    acceptExtensions: ["pdf"],
    outputFormat: "tiff",
    jobType: "convert",
    engineHint: "pdf-image",
  }),
  defineConverter({
    slug: "pdf-to-heic",
    title: "PDF to HEIC",
    description: "Export PDF pages as HEIC images.",
    categoryTags: ["pdf", "image", "convert"],
    acceptExtensions: ["pdf"],
    outputFormat: "heic",
    jobType: "convert",
    engineHint: "pdf-image",
  }),
  defineConverter({
    slug: "pdf-to-heif",
    title: "PDF to HEIF",
    description: "Export PDF pages as HEIF images.",
    categoryTags: ["pdf", "image", "convert"],
    acceptExtensions: ["pdf"],
    outputFormat: "heif",
    jobType: "convert",
    engineHint: "pdf-image",
  }),
  defineConverter({
    slug: "pdf-to-avif",
    title: "PDF to AVIF",
    description: "Export PDF pages as AVIF images.",
    categoryTags: ["pdf", "image", "convert"],
    acceptExtensions: ["pdf"],
    outputFormat: "avif",
    jobType: "convert",
    engineHint: "pdf-image",
  }),
  defineConverter({
    slug: "merge-pdf",
    title: "Merge PDF",
    description: "Combine multiple PDFs.",
    categoryTags: ["pdf", "merge"],
    acceptExtensions: ["pdf"],
    outputFormat: "pdf",
    jobType: "convert",
    engineHint: "pdf-merge",
  }),
  defineConverter({
    slug: "split-pdf",
    title: "Split PDF",
    description: "Split a PDF into separate pages.",
    categoryTags: ["pdf", "split"],
    acceptExtensions: ["pdf"],
    outputFormat: "pdf",
    jobType: "convert",
    engineHint: "pdf-split",
  }),
  defineConverter({
    slug: "word-to-jpg",
    title: "Word to JPG",
    description: "Render documents as images.",
    categoryTags: ["doc", "image", "convert"],
    acceptExtensions: ["docx"],
    outputFormat: "jpg",
    jobType: "convert",
    engineHint: "libreoffice",
  }),
  defineConverter({
    slug: "pdf-to-csv",
    title: "PDF to CSV",
    description: "Extract data tables to CSV.",
    categoryTags: ["pdf", "data", "extract"],
    acceptExtensions: ["pdf"],
    outputFormat: "csv",
    jobType: "extract",
    engineHint: "pdf-table-extract",
  }),
  defineConverter({
    slug: "excel-to-jpg",
    title: "Excel to JPG",
    description: "Share sheets as images.",
    categoryTags: ["spreadsheet", "image", "convert"],
    acceptExtensions: ["xlsx"],
    outputFormat: "jpg",
    jobType: "convert",
    engineHint: "libreoffice",
  }),
  defineConverter({
    slug: "html-to-pdf",
    title: "HTML to PDF",
    description: "Print web pages to PDF.",
    categoryTags: ["html", "pdf", "convert"],
    acceptExtensions: ["html"],
    outputFormat: "pdf",
    jobType: "convert",
    engineHint: "chrome-print",
  }),
  defineConverter({
    slug: "pdf-to-html",
    title: "PDF to HTML",
    description: "Export PDFs as web pages.",
    categoryTags: ["pdf", "html", "convert"],
    acceptExtensions: ["pdf"],
    outputFormat: "html",
    jobType: "convert",
    engineHint: "pdf-html",
  }),
  defineConverter({
    slug: "jpeg-to-png",
    title: "JPEG to PNG",
    description: "Swap formats without losing clarity.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["jpeg", "jpg"],
    outputFormat: "png",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "jpeg-to-avif",
    title: "JPEG to AVIF",
    description: "Compress JPEG images into AVIF.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["jpeg", "jpg"],
    outputFormat: "avif",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "jpeg-to-heic",
    title: "JPEG to HEIC",
    description: "Compress JPEG images into HEIC.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["jpeg", "jpg"],
    outputFormat: "heic",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "jpeg-to-svg",
    title: "JPEG to SVG",
    description: "Wrap JPEG images in an SVG container.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["jpeg", "jpg"],
    outputFormat: "svg",
    jobType: "convert",
    engineHint: "svg-wrap",
  }),
  defineConverter({
    slug: "png-to-document",
    title: "PNG to Document",
    description: "Turn scans into editable docs.",
    categoryTags: ["image", "doc", "convert"],
    acceptExtensions: ["png"],
    outputFormat: "docx",
    jobType: "convert",
    engineHint: "ocr-docx",
  }),
  defineConverter({
    slug: "png-to-jpg",
    title: "PNG to JPG",
    description: "Optimize images for the web.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["png"],
    outputFormat: "jpg",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "png-to-avif",
    title: "PNG to AVIF",
    description: "Compress PNG images into AVIF.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["png"],
    outputFormat: "avif",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "png-to-svg",
    title: "PNG to SVG",
    description: "Wrap PNG images in an SVG container.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["png"],
    outputFormat: "svg",
    jobType: "convert",
    engineHint: "svg-wrap",
  }),
  defineConverter({
    slug: "heic-to-jpg",
    title: "HEIC to JPG",
    description: "Open iPhone photos anywhere.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["heic"],
    outputFormat: "jpg",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "heif-to-jpeg",
    title: "HEIF to JPEG",
    description: "Convert HEIF images into JPEG files.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["heif"],
    outputFormat: "jpeg",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "heif-to-png",
    title: "HEIF to PNG",
    description: "Convert HEIF images into PNG files.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["heif"],
    outputFormat: "png",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "heic-to-avif",
    title: "HEIC to AVIF",
    description: "Convert HEIC images into AVIF files.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["heic"],
    outputFormat: "avif",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "heic-to-svg",
    title: "HEIC to SVG",
    description: "Wrap HEIC images in an SVG container.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["heic"],
    outputFormat: "svg",
    jobType: "convert",
    engineHint: "svg-wrap",
  }),
  defineConverter({
    slug: "tiff-to-pdf",
    title: "TIFF to PDF",
    description: "Bundle TIFF scans into PDF.",
    categoryTags: ["image", "pdf", "convert"],
    acceptExtensions: ["tiff", "tif"],
    outputFormat: "pdf",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "heic-to-pdf",
    title: "HEIC to PDF",
    description: "Bundle HEIC images into a PDF.",
    categoryTags: ["image", "pdf", "convert"],
    acceptExtensions: ["heic"],
    outputFormat: "pdf",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "heif-to-pdf",
    title: "HEIF to PDF",
    description: "Bundle HEIF images into a PDF.",
    categoryTags: ["image", "pdf", "convert"],
    acceptExtensions: ["heif"],
    outputFormat: "pdf",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "svg-to-png",
    title: "SVG to PNG",
    description: "Rasterize vector graphics.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["svg"],
    outputFormat: "png",
    jobType: "convert",
    engineHint: "rasterize",
  }),
  defineConverter({
    slug: "svg-to-jpeg",
    title: "SVG to JPEG",
    description: "Rasterize SVG graphics as JPEG images.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["svg"],
    outputFormat: "jpeg",
    jobType: "convert",
    engineHint: "rasterize",
  }),
  defineConverter({
    slug: "svg-to-heic",
    title: "SVG to HEIC",
    description: "Rasterize SVG graphics as HEIC images.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["svg"],
    outputFormat: "heic",
    jobType: "convert",
    engineHint: "rasterize",
  }),
  defineConverter({
    slug: "avif-to-jpeg",
    title: "AVIF to JPEG",
    description: "Convert AVIF images into JPEG files.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["avif"],
    outputFormat: "jpeg",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "avif-to-png",
    title: "AVIF to PNG",
    description: "Convert AVIF images into PNG files.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["avif"],
    outputFormat: "png",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "avif-to-heic",
    title: "AVIF to HEIC",
    description: "Convert AVIF images into HEIC files.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["avif"],
    outputFormat: "heic",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "webp-to-jpeg",
    title: "WebP to JPEG",
    description: "Convert WebP images into JPEG files.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["webp"],
    outputFormat: "jpeg",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "webp-to-png",
    title: "WebP to PNG",
    description: "Convert WebP images into PNG files.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["webp"],
    outputFormat: "png",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "webp-to-svg",
    title: "WebP to SVG",
    description: "Wrap WebP images in an SVG container.",
    categoryTags: ["image", "convert"],
    acceptExtensions: ["webp"],
    outputFormat: "svg",
    jobType: "convert",
    engineHint: "svg-wrap",
  }),
  defineConverter({
    slug: "jpg-to-pdf",
    title: "JPG to PDF",
    description: "Bundle images into a PDF.",
    categoryTags: ["image", "pdf", "convert"],
    acceptExtensions: ["jpg", "jpeg"],
    outputFormat: "pdf",
    jobType: "convert",
    engineHint: "image-magick",
    isHomeFeatured: true,
  }),
  defineConverter({
    slug: "png-to-pdf",
    title: "PNG to PDF",
    description: "Bundle PNG images into a PDF.",
    categoryTags: ["image", "pdf", "convert"],
    acceptExtensions: ["png"],
    outputFormat: "pdf",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "avif-to-pdf",
    title: "AVIF to PDF",
    description: "Bundle AVIF images into a PDF.",
    categoryTags: ["image", "pdf", "convert"],
    acceptExtensions: ["avif"],
    outputFormat: "pdf",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "webp-to-pdf",
    title: "WebP to PDF",
    description: "Bundle WebP images into a PDF.",
    categoryTags: ["image", "pdf", "convert"],
    acceptExtensions: ["webp"],
    outputFormat: "pdf",
    jobType: "convert",
    engineHint: "image-magick",
  }),
  defineConverter({
    slug: "svg-to-pdf",
    title: "SVG to PDF",
    description: "Convert SVG graphics into PDF pages.",
    categoryTags: ["image", "pdf", "convert"],
    acceptExtensions: ["svg"],
    outputFormat: "pdf",
    jobType: "convert",
    engineHint: "rasterize",
  }),
  defineConverter({
    slug: "csv-to-json",
    title: "CSV to JSON",
    description: "Convert structured data quickly.",
    categoryTags: ["data", "convert"],
    acceptExtensions: ["csv"],
    outputFormat: "json",
    jobType: "convert",
    engineHint: "node-transform",
  }),
];

export const converterCategories: ConverterCategory[] = [
  {
    title: "Image to Document",
    description: "Convert images into editable documents or text.",
    icon: "image-doc",
    converterSlugs: [
      "image-to-text",
      "jpeg-to-text",
      "png-to-text",
      "heic-to-text",
      "heif-to-text",
      "avif-to-text",
      "tiff-to-text",
      "svg-to-text",
      "jpg-to-word",
      "heic-to-word",
      "heif-to-word",
      "avif-to-docx",
      "png-to-document",
      "tiff-to-word",
      "jpg-to-excel",
      "png-to-xlsx",
      "avif-to-xlsx",
      "heic-to-xlsx",
      "heif-to-xlsx",
      "tiff-to-xlsx",
    ],
  },
  {
    title: "Image Format Converters",
    description: "Convert between image formats.",
    icon: "image-format",
    converterSlugs: [
      "jpeg-to-png",
      "jpeg-to-avif",
      "jpeg-to-heic",
      "jpeg-to-svg",
      "png-to-jpg",
      "png-to-avif",
      "png-to-svg",
      "heic-to-jpg",
      "heif-to-jpeg",
      "heif-to-png",
      "heic-to-avif",
      "heic-to-svg",
      "svg-to-png",
      "svg-to-jpeg",
      "svg-to-heic",
      "avif-to-jpeg",
      "avif-to-png",
      "avif-to-heic",
      "webp-to-jpeg",
      "webp-to-png",
      "webp-to-svg",
    ],
  },
  {
    title: "Image to PDF",
    description: "Bundle images into PDF documents.",
    icon: "image-pdf",
    converterSlugs: [
      "jpg-to-pdf",
      "png-to-pdf",
      "heic-to-pdf",
      "heif-to-pdf",
      "tiff-to-pdf",
      "avif-to-pdf",
      "webp-to-pdf",
      "svg-to-pdf",
    ],
  },
  {
    title: "Document to Image",
    description: "Export documents as images.",
    icon: "doc-image",
    converterSlugs: [
      "pdf-to-jpg",
      "pdf-to-jpeg",
      "pdf-to-png",
      "pdf-to-tiff",
      "pdf-to-heic",
      "pdf-to-heif",
      "pdf-to-avif",
      "word-to-jpg",
      "excel-to-jpg",
    ],
  },
  {
    title: "Document Converters",
    description: "Convert between document formats.",
    icon: "doc-convert",
    converterSlugs: [
      "word-to-pdf",
      "text-to-pdf",
      "pdf-to-excel",
      "pdf-to-xlsx",
      "pdf-to-docx",
      "pdf-to-csv",
      "pdf-to-text",
      "html-to-pdf",
      "pdf-to-html",
    ],
  },
  {
    title: "PDF Tools",
    description: "Manage and organize PDF files.",
    icon: "pdf-tools",
    converterSlugs: ["merge-pdf", "split-pdf"],
  },
  {
    title: "Data Tools",
    description: "Convert structured data formats.",
    icon: "data-tools",
    converterSlugs: ["csv-to-json"],
  },
];

export const supportedImageFormats = commonImageExtensions.map((ext) =>
  ext.toUpperCase(),
);

const normalizeSlug = (slug: string) => {
  try {
    return decodeURIComponent(slug).trim().toLowerCase();
  } catch {
    return slug.trim().toLowerCase();
  }
};

export const getConverterBySlug = (slug: string) =>
  converters.find((converter) => converter.slug === normalizeSlug(slug));

export const getConverterTags = () =>
  Array.from(
    new Set(converters.flatMap((converter) => converter.categoryTags)),
  ).sort();

export const getConverterCategoryGroups = (
  items: Converter[],
): ConverterCategoryGroup[] => {
  const lookup = new Map(items.map((converter) => [converter.slug, converter]));
  const groups = converterCategories
    .map((category) => ({
      title: category.title,
      description: category.description,
      icon: category.icon,
      items: category.converterSlugs
        .map((slug) => lookup.get(slug))
        .filter((converter): converter is Converter => Boolean(converter)),
    }))
    .filter((category) => category.items.length > 0);

  const categorizedSlugs = new Set(
    converterCategories.flatMap((category) => category.converterSlugs),
  );
  const uncategorized = items.filter(
    (converter) => !categorizedSlugs.has(converter.slug),
  );

  if (uncategorized.length) {
    groups.push({
      title: "More Converters",
      description: "Additional tools for other formats.",
      icon: "more",
      items: uncategorized,
    });
  }

  return groups;
};

export const getConverterHref = (
  converter: Converter,
  market: MarketCode = "global",
) =>
  converter.slug === "image-to-text"
    ? prefixMarketPath("/ocr", market)
    : prefixMarketPath(`/convert/${encodeURIComponent(converter.slug)}`, market);

export const getConverterPrimaryInput = (converter: Converter) =>
  converter.accept.mimeTypes.includes("image/*") &&
  converter.accept.extensions.length > 1
    ? "image"
    : converter.accept.extensions[0] || converter.outputFormat;

export const getConverterAccept = (converter: Converter) => {
  const parts = [
    ...converter.accept.mimeTypes,
    ...converter.accept.extensions.map((ext) => `.${ext}`),
  ];
  return uniqueValues(parts).join(",");
};

export const getConverterFormats = (converter: Converter) => {
  if (converter.accept.extensions.length) {
    return converter.accept.extensions.map((ext) => ext.toUpperCase());
  }
  return [converter.outputFormat.toUpperCase()];
};

export const featuredConverterSlugs = converters
  .filter((converter) => converter.isHomeFeatured)
  .map((converter) => converter.slug);

export const footerConverters = converters.filter(
  (converter) => converter.isHomeFeatured,
);
