export type Converter = {
  slug: string;
  title: string;
  from: string;
  to: string;
  description: string;
};

export const converters: Converter[] = [
  {
    slug: "image-to-text",
    title: "Image to Text",
    from: "png",
    to: "txt",
    description: "Extract text from images.",
  },
  {
    slug: "image-translator",
    title: "Image Translator",
    from: "png",
    to: "txt",
    description: "Translate text inside images.",
  },
  {
    slug: "jpg-to-word",
    title: "JPG to Word",
    from: "jpg",
    to: "docx",
    description: "Convert images into editable Word docs.",
  },
  {
    slug: "jpg-to-excel",
    title: "JPG to Excel",
    from: "jpg",
    to: "xlsx",
    description: "Turn tables into spreadsheets.",
  },
  {
    slug: "pdf-to-excel",
    title: "PDF to Excel",
    from: "pdf",
    to: "xlsx",
    description: "Extract tables into Excel.",
  },
  {
    slug: "word-to-pdf",
    title: "Word to PDF",
    from: "docx",
    to: "pdf",
    description: "Share documents as PDF.",
  },
  {
    slug: "pdf-to-jpg",
    title: "PDF to JPG",
    from: "pdf",
    to: "jpg",
    description: "Export pages as images.",
  },
  {
    slug: "merge-pdf",
    title: "Merge PDF",
    from: "pdf",
    to: "pdf",
    description: "Combine multiple PDFs.",
  },
  {
    slug: "qr-code-scanner",
    title: "QR Code Scanner",
    from: "png",
    to: "txt",
    description: "Read QR codes from images.",
  },
  {
    slug: "qr-code-generator",
    title: "QR Code Generator",
    from: "txt",
    to: "png",
    description: "Create QR codes from text.",
  },
  {
    slug: "barcode-scanner",
    title: "Barcode Scanner",
    from: "png",
    to: "txt",
    description: "Decode barcodes quickly.",
  },
  {
    slug: "word-to-jpg",
    title: "Word to JPG",
    from: "docx",
    to: "jpg",
    description: "Render documents as images.",
  },
  {
    slug: "pdf-to-csv",
    title: "PDF to CSV",
    from: "pdf",
    to: "csv",
    description: "Extract data tables to CSV.",
  },
  {
    slug: "excel-to-jpg",
    title: "Excel to JPG",
    from: "xlsx",
    to: "jpg",
    description: "Share sheets as images.",
  },
  {
    slug: "html-to-pdf",
    title: "HTML to PDF",
    from: "html",
    to: "pdf",
    description: "Print web pages to PDF.",
  },
  {
    slug: "pdf-to-html",
    title: "PDF to HTML",
    from: "pdf",
    to: "html",
    description: "Export PDFs as web pages.",
  },
  {
    slug: "jpeg-to-png",
    title: "JPEG to PNG",
    from: "jpg",
    to: "png",
    description: "Swap formats without losing clarity.",
  },
  {
    slug: "png-to-document",
    title: "PNG to Document",
    from: "png",
    to: "docx",
    description: "Turn scans into editable docs.",
  },
  {
    slug: "png-to-jpg",
    title: "PNG to JPG",
    from: "png",
    to: "jpg",
    description: "Optimize images for the web.",
  },
  {
    slug: "heic-to-jpg",
    title: "HEIC to JPG",
    from: "heic",
    to: "jpg",
    description: "Open iPhone photos anywhere.",
  },
  {
    slug: "tiff-to-pdf",
    title: "TIFF to PDF",
    from: "tiff",
    to: "pdf",
    description: "Bundle TIFF scans into PDF.",
  },
  {
    slug: "svg-to-png",
    title: "SVG to PNG",
    from: "svg",
    to: "png",
    description: "Rasterize vector graphics.",
  },
  {
    slug: "jpg-to-pdf",
    title: "JPG to PDF",
    from: "jpg",
    to: "pdf",
    description: "Bundle images into a PDF.",
  },
  {
    slug: "csv-to-json",
    title: "CSV to JSON",
    from: "csv",
    to: "json",
    description: "Convert structured data quickly.",
  },
];

export const featuredConverterSlugs = [
  "image-to-text",
  "pdf-to-jpg",
  "jpg-to-pdf",
  "word-to-pdf",
  "pdf-to-excel",
];

export const footerConverters = converters.filter((converter) =>
  featuredConverterSlugs.includes(converter.slug),
);

export const supportedImageFormats = [
  "JPG",
  "JPEG",
  "PNG",
  "GIF",
  "JFIF",
  "HEIC",
  "WEBP",
  "AVIF",
  "SVG",
  "TIF",
  "TIFF",
  "BMP",
  "PDF",
];

const acceptMap: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  heic: "image/heic",
  tiff: "image/tiff",
  tif: "image/tiff",
  bmp: "image/bmp",
  pdf: "application/pdf",
  docx:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx:
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  html: "text/html",
  txt: "text/plain",
};

export const getConverterBySlug = (slug: string) =>
  converters.find((converter) => converter.slug === slug);

export const getConverterHref = (converter: Converter) =>
  converter.slug === "image-to-text"
    ? "/"
    : `/converters/${converter.slug}`;

export const getConverterAccept = (converter: Converter) => {
  if (converter.slug === "image-to-text") {
    return "image/*,application/pdf";
  }
  return acceptMap[converter.from] ?? "";
};

export const getConverterFormats = (converter: Converter) => {
  if (converter.slug === "image-to-text") {
    return supportedImageFormats;
  }
  return [converter.from.toUpperCase()];
};
