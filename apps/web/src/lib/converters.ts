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
    slug: "image-translator",
    title: "Image Translator",
    description: "Translate text inside images.",
    categoryTags: ["image", "ocr", "translate"],
    acceptExtensions: commonImageExtensions,
    acceptMimeTypes: ["image/*"],
    outputFormat: "txt",
    jobType: "ocr",
    engineHint: "tesseract+translate",
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
      "image-translator",
      "jpg-to-word",
      "png-to-document",
      "jpg-to-excel",
    ],
  },
  {
    title: "Image Format Converters",
    description: "Convert between image formats.",
    icon: "image-format",
    converterSlugs: ["jpeg-to-png", "png-to-jpg", "heic-to-jpg", "svg-to-png"],
  },
  {
    title: "Image to PDF",
    description: "Bundle images into PDF documents.",
    icon: "image-pdf",
    converterSlugs: ["jpg-to-pdf", "tiff-to-pdf"],
  },
  {
    title: "Document to Image",
    description: "Export documents as images.",
    icon: "doc-image",
    converterSlugs: ["pdf-to-jpg", "word-to-jpg", "excel-to-jpg"],
  },
  {
    title: "Document Converters",
    description: "Convert between document formats.",
    icon: "doc-convert",
    converterSlugs: [
      "word-to-pdf",
      "pdf-to-excel",
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

export const getConverterHref = (converter: Converter) =>
  converter.slug === "image-to-text"
    ? "/"
    : `/convert/${encodeURIComponent(converter.slug)}`;

export const getConverterPrimaryInput = (converter: Converter) =>
  converter.accept.extensions[0] || converter.outputFormat;

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
