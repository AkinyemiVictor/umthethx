export type Family =
  | "red"
  | "blue"
  | "green"
  | "orange"
  | "emerald"
  | "zinc"
  | "slate"
  | "amber"
  | "yellow"
  | "violet"
  | "cyan";

const extensionMap: Record<string, Family> = {
  pdf: "red",
  doc: "blue",
  docx: "blue",
  xls: "green",
  xlsx: "green",
  ppt: "orange",
  pptx: "orange",
  csv: "emerald",
  txt: "zinc",
  md: "slate",
  html: "amber",
  json: "yellow",
  xml: "violet",
  png: "cyan",
  jpg: "cyan",
  jpeg: "cyan",
  gif: "cyan",
  jfif: "cyan",
  svg: "cyan",
  webp: "cyan",
  avif: "cyan",
  heic: "cyan",
  tif: "cyan",
  tiff: "cyan",
  bmp: "cyan",
};

const mimeToExt: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
  "text/csv": "csv",
  "text/plain": "txt",
  "text/markdown": "md",
  "text/html": "html",
  "application/json": "json",
  "application/ld+json": "json",
  "application/xml": "xml",
  "text/xml": "xml",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/tiff": "tiff",
  "image/bmp": "bmp",
};

export type FileTheme = {
  chipBg: string;
  chipText: string;
  border: string;
  icon: string;
  progress: string;
  progressTrack: string;
  ring: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
};

const normalizeExt = (ext?: string) => {
  if (!ext) return undefined;
  const trimmed = ext.trim().toLowerCase();
  if (!trimmed) return undefined;
  return trimmed.startsWith(".") ? trimmed.slice(1) : trimmed;
};

const extFromName = (name?: string) => {
  if (!name) return undefined;
  const parts = name.split(".");
  if (parts.length < 2) return undefined;
  return parts.pop();
};

const extFromMime = (mime?: string) => {
  if (!mime) return undefined;
  const key = mime.toLowerCase().split(";")[0]?.trim();
  if (!key) return undefined;
  if (mimeToExt[key]) return mimeToExt[key];
  const subtype = key.split("/")[1];
  if (!subtype) return undefined;
  if (subtype.includes("xml")) return "xml";
  return subtype;
};

export function familyForExt(ext?: string): Family {
  const key = normalizeExt(ext);
  if (!key) return "zinc";
  return extensionMap[key] ?? "zinc";
}

export function resolveFileType(options?: {
  ext?: string;
  mime?: string;
  name?: string;
}) {
  const resolvedExt =
    normalizeExt(options?.ext) ??
    normalizeExt(extFromName(options?.name)) ??
    normalizeExt(extFromMime(options?.mime));
  const family = familyForExt(resolvedExt);
  const label = resolvedExt ? resolvedExt.toUpperCase() : "FILE";
  return { ext: resolvedExt, family, label };
}

export function fileAriaLabel(options?: {
  ext?: string;
  mime?: string;
  name?: string;
}) {
  const { label } = resolveFileType(options);
  return label === "FILE" ? "File" : `${label} file`;
}

export function fileTheme(ext?: string): FileTheme {
  const f = familyForExt(ext);
  return {
    chipBg: `bg-${f}-100 dark:bg-${f}-950/40`,
    chipText: `text-${f}-700 dark:text-${f}-300`,
    border: `border-${f}-300 dark:border-${f}-700`,
    icon: `text-${f}-600 dark:text-${f}-400`,
    progress: `bg-${f}-600`,
    progressTrack: "bg-zinc-200 dark:bg-zinc-900",
    ring: `ring-${f}-500`,
    errorBg: `bg-${f}-700/10 dark:bg-${f}-700/20`,
    errorBorder: `border-${f}-700 dark:border-${f}-700`,
    errorText: `text-${f}-700 dark:text-${f}-300`,
  };
}
