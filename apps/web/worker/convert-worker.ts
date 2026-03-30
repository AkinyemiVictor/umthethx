import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Worker, type ConnectionOptions } from "bullmq";
import { createReadStream, createWriteStream } from "fs";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { pipeline } from "stream/promises";
import { spawn } from "child_process";
import { Readable } from "stream";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Document, Packer, Paragraph } from "docx";
import { PDFDocument } from "pdf-lib";
import {
  buildArtifactKey,
  getS3Bucket,
  getS3Client,
} from "../src/lib/s3";
import { detectTextFromImageBytesDetailed } from "../src/lib/textract";
import {
  getJobRecord,
  updateJobRecord,
  type JobInput,
  type JobOutput,
} from "../src/lib/job-store";
import { getConverterBySlug } from "../src/lib/converters";
import { QUEUE_NAME, getRedisConnection } from "../src/lib/queue";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptsDir = path.join(__dirname, "scripts");
const repoRoot = path.resolve(__dirname, "../../..");
const isRailwayRuntime = Boolean(
  process.env.RAILWAY_PROJECT_ID ||
    process.env.RAILWAY_SERVICE_ID ||
    process.env.RAILWAY_ENVIRONMENT_NAME,
);

if (!isRailwayRuntime) {
  dotenv.config({ path: path.join(repoRoot, ".env"), override: false });
  dotenv.config({ path: path.join(repoRoot, ".env.local"), override: true });
}

const s3 = getS3Client();
const bucket = getS3Bucket();

const LIBRETRANSLATE_URL =
  process.env.LIBRETRANSLATE_URL?.trim() || "http://libretranslate:5000";
const LIBRETRANSLATE_TARGET =
  process.env.LIBRETRANSLATE_TARGET_LANG?.trim() || "en";
const LIBRETRANSLATE_SOURCE =
  process.env.LIBRETRANSLATE_SOURCE_LANG?.trim() || "auto";
const LIBRETRANSLATE_API_KEY = process.env.LIBRETRANSLATE_API_KEY?.trim();
const TESSERACT_BIN = process.env.TESSERACT_BIN?.trim() || "tesseract";
const TESSERACT_LANG = process.env.TESSERACT_LANG?.trim() || "eng";

const COMMAND_TIMEOUT_MS = 10 * 60 * 1000;
const MIN_OCR_TEXT_SCORE = 5;
const MIN_PDF_EXTRACTED_TEXT_SCORE = 15;
const DEFAULT_MAX_DOCUMENT_PAGES = 30;
const OCR_BASE_TARGET_PIXELS = 2200;
const OCR_MAX_SCALE_FACTOR = 4;
const OCR_SHARPEN_KERNEL = [
  [0, -1, 0],
  [-1, 5, -1],
  [0, -1, 0],
];
const COMMON_SHORT_OCR_WORDS = new Set([
  "a",
  "am",
  "an",
  "at",
  "by",
  "dr",
  "id",
  "in",
  "kg",
  "lb",
  "mr",
  "ms",
  "no",
  "of",
  "on",
  "or",
  "oz",
  "pm",
  "to",
  "tv",
  "uk",
  "us",
]);

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

const MAX_DOCUMENT_PAGES = parsePositiveInteger(
  process.env.MAX_DOCUMENT_PAGES?.trim(),
  DEFAULT_MAX_DOCUMENT_PAGES,
);
const WORKER_KEEPALIVE_MS = parsePositiveInteger(
  process.env.WORKER_KEEPALIVE_MS?.trim(),
  60_000,
);

const describeRedisTarget = () => {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    try {
      return new URL(redisUrl).host;
    } catch {
      return "invalid REDIS_URL";
    }
  }

  const host = process.env.REDIS_HOST?.trim();
  const port = process.env.REDIS_PORT?.trim() || "6379";
  return host ? `${host}:${port}` : "unconfigured";
};

const sanitizeFileName = (fileName: string) => {
  const cleaned = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+/, "")
    .trim();
  return cleaned.length > 0 ? cleaned : "file";
};

const stripExtension = (fileName: string) => {
  const idx = fileName.lastIndexOf(".");
  return idx > 0 ? fileName.slice(0, idx) : fileName;
};

const contentTypeByExtension: Record<string, string> = {
  txt: "text/plain",
  pdf: "application/pdf",
  docx:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx:
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  json: "application/json",
  html: "text/html",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  avif: "image/avif",
  svg: "image/svg+xml",
  heic: "image/heic",
  heif: "image/heif",
  tif: "image/tiff",
  tiff: "image/tiff",
  webp: "image/webp",
  zip: "application/zip",
};

const getContentType = (filePath: string) => {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return contentTypeByExtension[ext] || "application/octet-stream";
};

const runCommand = (
  command: string,
  args: string[],
  options: { cwd?: string; windowsHide?: boolean } = {},
) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: options.windowsHide ?? false,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${command} timed out`));
    }, COMMAND_TIMEOUT_MS);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(
        new Error(
          `${command} failed (${code ?? "unknown"}): ${stderr || stdout}`,
        ),
      );
    });
  });

const isMissingCommandError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const err = error as NodeJS.ErrnoException;
  if (err.code === "ENOENT") return true;
  const message = typeof err.message === "string" ? err.message : "";
  return message.toLowerCase().includes("enoent") || message.toLowerCase().includes("not found");
};

const isMissingModuleError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const err = error as NodeJS.ErrnoException & { code?: string };
  if (err.code === "ERR_MODULE_NOT_FOUND" || err.code === "MODULE_NOT_FOUND") {
    return true;
  }
  const message = typeof err.message === "string" ? err.message : "";
  return message.toLowerCase().includes("cannot find module");
};

type PythonCommand = {
  command: string;
  baseArgs: string[];
};

type LibreOfficeCommand = {
  command: string;
  baseArgs: string[];
};

type XlsxModule = typeof import("xlsx");
type ImageMagickCommand = {
  command: string;
  baseArgs: string[];
};

type JimpImage = {
  writeAsync: (path: string) => Promise<void>;
  quality?: (value: number) => JimpImage;
  background?: (value: number) => JimpImage;
  clone: () => JimpImage;
  getWidth: () => number;
  getHeight: () => number;
  grayscale?: () => JimpImage;
  greyscale?: () => JimpImage;
  normalize: () => JimpImage;
  contrast: (value: number) => JimpImage;
  brightness: (value: number) => JimpImage;
  scale: (value: number, mode?: string) => JimpImage;
  gaussian: (radius: number) => JimpImage;
  threshold: (options: {
    max: number;
    replace?: number;
    autoGreyscale?: boolean;
  }) => JimpImage;
  invert: () => JimpImage;
  convolute: (kernel: number[][]) => JimpImage;
};

type JimpModule = {
  read: (path: string | Buffer) => Promise<JimpImage>;
};

type HeicDecodeImage = {
  data: ArrayBuffer | Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
};

type HeicDecodeResult = HeicDecodeImage | HeicDecodeImage[] | { images: HeicDecodeImage[] };

type HeicDecodeFn = (options: {
  buffer: Buffer | Uint8Array;
}) => Promise<HeicDecodeResult> | HeicDecodeResult;

type JpegModule = {
  encode: (
    image: { data: Uint8Array; width: number; height: number },
    quality: number,
  ) => { data: Buffer };
};

type ResvgRender = {
  asPng: () => Uint8Array;
};

type ResvgInstance = {
  render: () => ResvgRender;
};

type ResvgModule = {
  Resvg: new (svg: string, options?: { fitTo?: { mode: "original" } }) => ResvgInstance;
};

type PdfJsDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<{
    getViewport: (options: { scale: number }) => { width: number; height: number };
    render: (options: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }) => { promise: Promise<void> };
  }>;
  cleanup?: () => void;
};

type PdfJsLoadingTask = {
  promise: Promise<PdfJsDocument>;
  destroy?: () => Promise<void>;
};

type PdfJsModule = {
  getDocument: (options: { data: Uint8Array | Buffer; disableWorker?: boolean }) => PdfJsLoadingTask;
};

type CanvasModule = {
  createCanvas: (width: number, height: number) => {
    getContext: (contextId: "2d") => CanvasRenderingContext2D | null;
    toBuffer: (type: "image/jpeg", options?: { quality?: number }) => Buffer;
  };
};

type JsZipFileOptions = {
  date?: Date;
};

type JsZipInstance = {
  file: (name: string, data: Buffer, options?: JsZipFileOptions) => void;
  folder: (name: string) => JsZipInstance;
  generateAsync: (options: { type: "nodebuffer" }) => Promise<Buffer>;
};

type JsZipModule = new () => JsZipInstance;

let cachedPython: PythonCommand | null = null;
let resolvingPython: Promise<PythonCommand> | null = null;
let cachedLibreOffice: LibreOfficeCommand | null = null;
let resolvingLibreOffice: Promise<LibreOfficeCommand> | null = null;
let cachedXlsx: XlsxModule | null = null;
let resolvingXlsx: Promise<XlsxModule> | null = null;
let cachedImageMagick: ImageMagickCommand | null = null;
let resolvingImageMagick: Promise<ImageMagickCommand> | null = null;
let cachedJimp: JimpModule | null = null;
let resolvingJimp: Promise<JimpModule> | null = null;
let cachedHeicDecode: HeicDecodeFn | null = null;
let resolvingHeicDecode: Promise<HeicDecodeFn> | null = null;
let cachedJpegModule: JpegModule | null = null;
let resolvingJpegModule: Promise<JpegModule> | null = null;
let cachedResvg: ResvgModule | null = null;
let resolvingResvg: Promise<ResvgModule> | null = null;
let cachedPdfjs: PdfJsModule | null = null;
let resolvingPdfjs: Promise<PdfJsModule> | null = null;
let cachedCanvas: CanvasModule | null = null;
let resolvingCanvas: Promise<CanvasModule> | null = null;
let cachedJsZip: JsZipModule | null = null;
let resolvingJsZip: Promise<JsZipModule> | null = null;

const getPythonCommand = async (): Promise<PythonCommand> => {
  if (cachedPython) return cachedPython;
  if (resolvingPython) return resolvingPython;

  resolvingPython = (async () => {
    const envBin = process.env.PYTHON_BIN?.trim() || process.env.PYTHON?.trim();
    const candidates: PythonCommand[] = [];
    if (envBin) {
      candidates.push({ command: envBin, baseArgs: [] });
    }
    if (process.platform === "win32") {
      candidates.push(
        { command: "py", baseArgs: ["-3"] },
        { command: "python", baseArgs: [] },
        { command: "python3", baseArgs: [] },
      );
    } else {
      candidates.push(
        { command: "python3", baseArgs: [] },
        { command: "python", baseArgs: [] },
      );
    }

    let lastError: unknown;
    for (const candidate of candidates) {
      try {
        await runCommand(candidate.command, [
          ...candidate.baseArgs,
          "--version",
        ]);
        cachedPython = candidate;
        return candidate;
      } catch (error) {
        lastError = error;
      }
    }

    const hint =
      lastError instanceof Error && lastError.message
        ? ` Last error: ${lastError.message}`
        : "";
    throw new Error(
      `Python 3 not found. Install Python or set PYTHON_BIN to your python executable.${hint}`,
    );
  })();

  return resolvingPython;
};

const runPython = async (args: string[]) => {
  const python = await getPythonCommand();
  return runCommand(python.command, [...python.baseArgs, ...args]);
};

const getLibreOfficeCommand = async (): Promise<LibreOfficeCommand> => {
  if (cachedLibreOffice) return cachedLibreOffice;
  if (resolvingLibreOffice) return resolvingLibreOffice;

  resolvingLibreOffice = (async () => {
    const envBin =
      process.env.LIBREOFFICE_BIN?.trim() ||
      process.env.SOFFICE_BIN?.trim() ||
      process.env.LIBREOFFICE_PATH?.trim();
    const candidates: LibreOfficeCommand[] = [];
    if (envBin) {
      candidates.push({ command: envBin, baseArgs: [] });
    }
    candidates.push({ command: "soffice", baseArgs: [] });
    candidates.push({ command: "libreoffice", baseArgs: [] });

    let lastError: unknown;
    for (const candidate of candidates) {
      try {
        await runCommand(candidate.command, [
          ...candidate.baseArgs,
          "--version",
        ]);
        cachedLibreOffice = candidate;
        return candidate;
      } catch (error) {
        lastError = error;
        if (!isMissingCommandError(error)) {
          throw error;
        }
      }
    }

    const hint =
      lastError instanceof Error && lastError.message
        ? ` Last error: ${lastError.message}`
        : "";
    throw new Error(
      `LibreOffice not found. Install LibreOffice or set LIBREOFFICE_BIN.${hint}`,
    );
  })();

  return resolvingLibreOffice;
};

const getImageMagickCommand = async (): Promise<ImageMagickCommand> => {
  if (cachedImageMagick) return cachedImageMagick;
  if (resolvingImageMagick) return resolvingImageMagick;

  resolvingImageMagick = (async () => {
    const envBin =
      process.env.IMAGEMAGICK_BIN?.trim() || process.env.MAGICK_BIN?.trim();
    const candidates: ImageMagickCommand[] = [];
    if (envBin) {
      candidates.push({ command: envBin, baseArgs: [] });
    }

    if (process.platform === "win32") {
      candidates.push(
        { command: "magick", baseArgs: [] },
        { command: "magick.exe", baseArgs: [] },
      );
    } else {
      candidates.push(
        { command: "magick", baseArgs: [] },
        { command: "convert", baseArgs: [] },
      );
    }

    let lastError: unknown;
    for (const candidate of candidates) {
      try {
        await runCommand(candidate.command, [
          ...candidate.baseArgs,
          "-version",
        ]);
        cachedImageMagick = candidate;
        return candidate;
      } catch (error) {
        lastError = error;
        if (!isMissingCommandError(error)) {
          throw error;
        }
      }
    }

    const hint =
      lastError instanceof Error && lastError.message
        ? ` Last error: ${lastError.message}`
        : "";
    throw new Error(
      `ImageMagick not found. Install ImageMagick or set IMAGEMAGICK_BIN.${hint}`,
    );
  })();

  return resolvingImageMagick;
};

const getXlsxModule = async (): Promise<XlsxModule> => {
  if (cachedXlsx) return cachedXlsx;
  if (resolvingXlsx) return resolvingXlsx;

  resolvingXlsx = (async () => {
    const mod = await import("xlsx");
    const resolved = (mod.default ?? mod) as XlsxModule;
    cachedXlsx = resolved;
    return resolved;
  })();

  return resolvingXlsx;
};

const runImageMagick = async (args: string[]) => {
  const command = await getImageMagickCommand();
  await runCommand(command.command, [...command.baseArgs, ...args]);
};

const resolveJimpModule = (mod: unknown): JimpModule | null => {
  if (!mod || typeof mod !== "object") return null;
  const candidate = mod as {
    default?: JimpModule;
    Jimp?: JimpModule;
  };
  if (candidate.default?.read) return candidate.default;
  if (candidate.Jimp?.read) return candidate.Jimp;
  if ((mod as JimpModule).read) return mod as JimpModule;
  return null;
};

const getJimpModule = async (): Promise<JimpModule> => {
  if (cachedJimp) return cachedJimp;
  if (resolvingJimp) return resolvingJimp;

  resolvingJimp = (async () => {
    try {
      const mod = await import("jimp");
      const resolved = resolveJimpModule(mod);
      if (!resolved) {
        throw new Error("Jimp module does not expose read().");
      }
      cachedJimp = resolved;
      return resolved;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      throw new Error(
        `Jimp not available. Install the jimp dependency or ImageMagick. ${message}`,
      );
    }
  })();

  return resolvingJimp;
};

const isImageMagickUnavailable = (error: unknown) => {
  if (isMissingCommandError(error)) return true;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("imagemagick not found")) return true;
  if (process.platform === "win32" && message.includes("convert failed")) {
    // Windows ships convert.exe, which isn't ImageMagick and returns "Invalid Parameter".
    return true;
  }
  return false;
};

const canJimpConvert = (inputExt: string, outputExt: string) => {
  const supported = new Set(["jpg", "jpeg", "png"]);
  return supported.has(inputExt) && supported.has(outputExt);
};

const runJimpConvert = async (inputPath: string, outputPath: string) => {
  const jimp = await getJimpModule();
  const image = await jimp.read(inputPath);
  const outputExt = path.extname(outputPath).slice(1).toLowerCase();
  if (outputExt === "jpg" || outputExt === "jpeg") {
    image.background?.(0xffffffff);
    image.quality?.(90);
  }
  await image.writeAsync(outputPath);
};

const resolveHeicDecode = (mod: unknown): HeicDecodeFn | null => {
  if (!mod) return null;
  if (typeof mod === "function") return mod as HeicDecodeFn;
  if (typeof mod !== "object") return null;
  const candidate = mod as {
    decode?: HeicDecodeFn;
    default?: { decode?: HeicDecodeFn } | HeicDecodeFn;
  };
  if (candidate.decode) return candidate.decode;
  if (typeof candidate.default === "function") {
    return candidate.default as HeicDecodeFn;
  }
  if (candidate.default && "decode" in candidate.default) {
    return (candidate.default as { decode?: HeicDecodeFn }).decode ?? null;
  }
  return null;
};

const getHeicDecode = async (): Promise<HeicDecodeFn> => {
  if (cachedHeicDecode) return cachedHeicDecode;
  if (resolvingHeicDecode) return resolvingHeicDecode;

  resolvingHeicDecode = (async () => {
    try {
      const mod = await import("heic-decode");
      const resolved = resolveHeicDecode(mod);
      if (!resolved) {
        throw new Error("heic-decode does not expose decode().");
      }
      cachedHeicDecode = resolved;
      return resolved;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      throw new Error(
        `HEIC decoder not available. Install heic-decode or ImageMagick. ${message}`,
      );
    }
  })();

  return resolvingHeicDecode;
};

const resolveJpegModule = (mod: unknown): JpegModule | null => {
  if (!mod || typeof mod !== "object") return null;
  const candidate = mod as {
    default?: JpegModule;
    encode?: JpegModule["encode"];
  };
  if (candidate.encode) return { encode: candidate.encode };
  if (candidate.default?.encode) return candidate.default;
  return null;
};

const getJpegModule = async (): Promise<JpegModule> => {
  if (cachedJpegModule) return cachedJpegModule;
  if (resolvingJpegModule) return resolvingJpegModule;

  resolvingJpegModule = (async () => {
    try {
      const mod = await import("jpeg-js");
      const resolved = resolveJpegModule(mod);
      if (!resolved) {
        throw new Error("jpeg-js does not expose encode().");
      }
      cachedJpegModule = resolved;
      return resolved;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      throw new Error(
        `JPEG encoder not available. Install jpeg-js or ImageMagick. ${message}`,
      );
    }
  })();

  return resolvingJpegModule;
};

const getResvgModule = async (): Promise<ResvgModule> => {
  if (cachedResvg) return cachedResvg;
  if (resolvingResvg) return resolvingResvg;

  resolvingResvg = (async () => {
    try {
      const mod = await import("@resvg/resvg-js");
      const candidate = mod as { Resvg?: ResvgModule["Resvg"] };
      if (!candidate.Resvg) {
        throw new Error("Resvg export not found.");
      }
      const resolved: ResvgModule = { Resvg: candidate.Resvg };
      cachedResvg = resolved;
      return resolved;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      throw new Error(
        `Resvg not available. Install @resvg/resvg-js or rsvg-convert. ${message}`,
      );
    }
  })();

  return resolvingResvg;
};

const getPdfjsModule = async (): Promise<PdfJsModule> => {
  if (cachedPdfjs) return cachedPdfjs;
  if (resolvingPdfjs) return resolvingPdfjs;

  resolvingPdfjs = (async () => {
    const candidates = [
      "pdfjs-dist/legacy/build/pdf.mjs",
      "pdfjs-dist/legacy/build/pdf.js",
      "pdfjs-dist/build/pdf.mjs",
      "pdfjs-dist/build/pdf.js",
    ];

    let lastError: unknown;
    for (const specifier of candidates) {
      try {
        const mod = (await import(specifier)) as unknown;
        const resolved = (() => {
          if (mod && typeof mod === "object" && "getDocument" in mod) {
            return mod as PdfJsModule;
          }
          if (
            mod &&
            typeof mod === "object" &&
            "default" in mod &&
            (mod as { default?: PdfJsModule }).default?.getDocument
          ) {
            return (mod as { default: PdfJsModule }).default;
          }
          return null;
        })();
        if (!resolved) {
          throw new Error(`pdfjs getDocument export not found in ${specifier}.`);
        }
        cachedPdfjs = resolved;
        return resolved;
      } catch (error) {
        lastError = error;
        if (!isMissingModuleError(error)) {
          throw error;
        }
      }
    }

    const message = lastError instanceof Error ? lastError.message : "Unknown error.";
    throw new Error(
      `pdfjs-dist not available. Install pdfjs-dist or Poppler. ${message}`,
    );
  })();

  return resolvingPdfjs;
};

const getCanvasModule = async (): Promise<CanvasModule> => {
  if (cachedCanvas) return cachedCanvas;
  if (resolvingCanvas) return resolvingCanvas;

  resolvingCanvas = (async () => {
    try {
      const mod = (await import("@napi-rs/canvas")) as unknown;
      const resolved = (() => {
        if (mod && typeof mod === "object" && "createCanvas" in mod) {
          return mod as CanvasModule;
        }
        if (
          mod &&
          typeof mod === "object" &&
          "default" in mod &&
          (mod as { default?: CanvasModule }).default?.createCanvas
        ) {
          return (mod as { default: CanvasModule }).default;
        }
        return null;
      })();
      if (!resolved) {
        throw new Error("@napi-rs/canvas createCanvas export not found.");
      }
      cachedCanvas = resolved;
      return resolved;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      throw new Error(
        `Canvas not available. Install @napi-rs/canvas or Poppler. ${message}`,
      );
    }
  })();

  return resolvingCanvas;
};

const getJsZipModule = async (): Promise<JsZipModule> => {
  if (cachedJsZip) return cachedJsZip;
  if (resolvingJsZip) return resolvingJsZip;

  resolvingJsZip = (async () => {
    try {
      const mod = (await import("jszip")) as unknown;
      const resolved = (() => {
        if (typeof mod === "function") {
          return mod as JsZipModule;
        }
        if (
          mod &&
          typeof mod === "object" &&
          "default" in mod &&
          typeof (mod as { default?: unknown }).default === "function"
        ) {
          return (mod as { default: JsZipModule }).default;
        }
        return null;
      })();
      if (!resolved) {
        throw new Error("jszip export not found.");
      }
      cachedJsZip = resolved;
      return resolved;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      throw new Error(`jszip not available. Install jszip. ${message}`);
    }
  })();

  return resolvingJsZip;
};

const isHeicDecodeImage = (value: unknown): value is HeicDecodeImage => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as {
    data?: unknown;
    width?: unknown;
    height?: unknown;
  };
  const hasData =
    candidate.data instanceof ArrayBuffer ||
    candidate.data instanceof Uint8Array ||
    candidate.data instanceof Uint8ClampedArray;
  return (
    hasData &&
    typeof candidate.width === "number" &&
    typeof candidate.height === "number"
  );
};

const pickHeicImage = (result: HeicDecodeResult): HeicDecodeImage => {
  if (Array.isArray(result)) {
    const first = result.find(isHeicDecodeImage);
    if (first) return first;
  } else if (result && typeof result === "object" && "images" in result) {
    const images = (result as { images?: HeicDecodeImage[] }).images;
    if (Array.isArray(images) && images.length > 0 && isHeicDecodeImage(images[0])) {
      return images[0];
    }
  } else if (isHeicDecodeImage(result)) {
    return result;
  }
  throw new Error("Unable to read HEIC image data.");
};

const runHeicToJpeg = async (inputPath: string, outputPath: string) => {
  const buffer = await readFile(inputPath);
  const decode = await getHeicDecode();
  const decoded = await decode({ buffer });
  const image = pickHeicImage(decoded);
  const jpeg = await getJpegModule();
  const rawData =
    image.data instanceof ArrayBuffer
      ? new Uint8Array(image.data)
      : image.data;
  const data = Buffer.from(rawData);
  const encoded = jpeg.encode(
    { data, width: image.width, height: image.height },
    90,
  );
  await writeFile(outputPath, encoded.data);
};

const runSvgToPng = async (inputPath: string, outputPath: string) => {
  try {
    await runCommand("rsvg-convert", ["-f", "png", "-o", outputPath, inputPath]);
    return;
  } catch (error) {
    if (!isMissingCommandError(error)) {
      throw error;
    }
  }

  try {
    const svgSource = await readFile(inputPath, "utf8");
    const { Resvg } = await getResvgModule();
    const resvg = new Resvg(svgSource, { fitTo: { mode: "original" } });
    const png = resvg.render().asPng();
    await writeFile(outputPath, Buffer.from(png));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    throw new Error(`rsvg-convert not found and resvg fallback failed: ${message}`);
  }
};

const runImageConvert = async (inputPath: string, outputPath: string) => {
  try {
    await runImageMagick([inputPath, outputPath]);
    return;
  } catch (error) {
    if (!isImageMagickUnavailable(error)) {
      throw error;
    }
  }

  const inputExt = path.extname(inputPath).slice(1).toLowerCase();
  const outputExt = path.extname(outputPath).slice(1).toLowerCase();
  if (canJimpConvert(inputExt, outputExt)) {
    try {
      await runJimpConvert(inputPath, outputPath);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      throw new Error(`ImageMagick not found and Jimp fallback failed: ${message}`);
    }
  }

  if (
    (inputExt === "heic" || inputExt === "heif") &&
    (outputExt === "jpg" || outputExt === "jpeg")
  ) {
    try {
      await runHeicToJpeg(inputPath, outputPath);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      throw new Error(
        `ImageMagick not found and HEIC fallback failed: ${message}`,
      );
    }
  }

  if (!canJimpConvert(inputExt, outputExt)) {
    throw new Error(
      `ImageMagick not found. Install ImageMagick to convert ${inputExt.toUpperCase()} to ${outputExt.toUpperCase()}.`,
    );
  }
};

const streamToFile = async (body: unknown, filePath: string) => {
  if (!body) throw new Error("Missing S3 body.");
  if (body instanceof Readable) {
    await pipeline(body, createWriteStream(filePath));
    return;
  }
  if (body instanceof Uint8Array) {
    await writeFile(filePath, body);
    return;
  }
  if (typeof body === "string") {
    await writeFile(filePath, body);
    return;
  }
  if (
    typeof (body as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer ===
    "function"
  ) {
    const buffer = Buffer.from(
      await (body as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer(),
    );
    await writeFile(filePath, buffer);
    return;
  }
  throw new Error("Unsupported S3 body type.");
};

const downloadInput = async (key: string, filePath: string) => {
  const response = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  await streamToFile(response.Body, filePath);
};

const uploadOutput = async (filePath: string, key: string) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: getContentType(filePath),
    }),
  );
};

const normalizeOcrLine = (value: string) =>
  value
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

const isOcrNoiseLine = (line: string) => {
  if (!line) return true;
  if (!/[A-Za-z0-9]/.test(line)) return true;
  if (/^[|\\/_\-.,:;"'`~()[\]{}=+*]+$/.test(line)) return true;

  const compact = line.replace(/\s+/g, "");
  if (compact.length === 1) {
    return true;
  }

  if (/^[A-Za-z]{1,2}$/.test(compact)) {
    return !COMMON_SHORT_OCR_WORDS.has(compact.toLowerCase());
  }

  return false;
};

const cleanOcrText = (text: string) => {
  const rawLines = text.split(/\r?\n/).map(normalizeOcrLine);
  const cleaned: string[] = [];

  for (let index = 0; index < rawLines.length; index += 1) {
    const line = rawLines[index];
    if (!line) continue;

    if (isOcrNoiseLine(line)) {
      const previous = cleaned[cleaned.length - 1] ?? "";
      const next = rawLines
        .slice(index + 1)
        .find((candidate) => candidate.length > 0) ?? "";
      const surroundedByLongLines =
        previous.replace(/\s+/g, "").length >= 8 ||
        next.replace(/\s+/g, "").length >= 8;
      if (surroundedByLongLines) {
        continue;
      }
    }

    if (cleaned[cleaned.length - 1] === line) {
      continue;
    }

    cleaned.push(line);
  }

  return cleaned.join("\n").trim();
};

type OcrScoreOptions = {
  source?: string;
  averageConfidence?: number;
  lineCount?: number;
  lowConfidenceLineCount?: number;
};

const getSuspiciousOcrTokenPenalty = (token: string) => {
  const compact = token.replace(/[^A-Za-z0-9'-]/g, "");
  if (compact.length < 4 || /\d/.test(compact)) {
    return 0;
  }

  let penalty = 0;
  if (!/[aeiouy]/i.test(compact)) {
    penalty += 4;
  }
  if (/([A-Za-z]{1,2})\1{2,}/.test(compact)) {
    penalty += 4;
  }
  if (new Set(compact.toLowerCase()).size <= 2 && compact.length >= 5) {
    penalty += 3;
  }

  return penalty;
};

const scoreOcrText = (text: string, options: OcrScoreOptions = {}) => {
  const cleaned = cleanOcrText(text);
  const normalized = cleaned.replace(/\s+/g, " ").trim();
  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const alphaNum = (normalized.match(/[A-Za-z0-9]/g) ?? []).length;
  const words = normalized.length > 0 ? normalized.split(" ").length : 0;
  const usefulLines = lines.filter((line) => {
    const compact = line.replace(/\s+/g, "");
    return compact.length >= 4 || /\d/.test(line) || line.includes(" ");
  }).length;
  const noisyLines = lines.filter(isOcrNoiseLine).length;
  const suspiciousTokenPenalty = normalized
    .split(" ")
    .reduce((sum, token) => sum + getSuspiciousOcrTokenPenalty(token), 0);
  let score =
    alphaNum +
    words * 2 +
    usefulLines * 5 -
    noisyLines * 10 -
    suspiciousTokenPenalty;

  if (options.source?.startsWith("textract")) {
    score += Math.round((options.averageConfidence ?? 0) / 5);
    score += Math.min((options.lineCount ?? 0) * 2, 10);
    score -= (options.lowConfidenceLineCount ?? 0) * 3;
  }

  return score;
};

const readOcrOutput = async (outputBase: string) => {
  const outputPath = `${outputBase}.txt`;
  try {
    return await readFile(outputPath, "utf8");
  } catch {
    return "";
  }
};

const applyJimpGreyscale = (image: JimpImage) => {
  if (image.greyscale) {
    image.greyscale();
    return image;
  }
  image.grayscale?.();
  return image;
};

const runTesseractAttempt = async (options: {
  command: string;
  inputPath: string;
  outputBase: string;
  psm: number;
}) => {
  await runCommand(options.command, [
    options.inputPath,
    options.outputBase,
    "-l",
    TESSERACT_LANG,
    "--oem",
    "1",
    "--psm",
    String(options.psm),
    "-c",
    "preserve_interword_spaces=1",
    "-c",
    "user_defined_dpi=300",
  ]);
  return readOcrOutput(options.outputBase);
};

const buildPreprocessedOcrImages = async (
  inputPath: string,
  outputDir: string,
  baseName: string,
) => {
  const safeBaseName = sanitizeFileName(baseName);
  const variants: Array<{ kind: string; path: string }> = [];
  const jimp = await getJimpModule();
  const baseImage = await jimp.read(inputPath);
  const longestSide = Math.max(baseImage.getWidth(), baseImage.getHeight(), 1);
  const scaleFactor = Math.min(
    OCR_MAX_SCALE_FACTOR,
    Math.max(2, OCR_BASE_TARGET_PIXELS / longestSide),
  );

  const writeVariant = async (
    suffix: string,
    transform: (image: JimpImage) => void,
  ) => {
    const variantPath = path.join(
      outputDir,
      `${safeBaseName}-ocr-${suffix}.png`,
    );
    const image = baseImage.clone();
    applyJimpGreyscale(image);
    image.normalize();
    image.scale(scaleFactor);
    transform(image);
    await image.writeAsync(variantPath);
    variants.push({ kind: suffix, path: variantPath });
  };

  await writeVariant("handwriting", (image) => {
    image.brightness(0.04);
    image.contrast(0.3);
    image.gaussian(1);
    image.convolute(OCR_SHARPEN_KERNEL);
  });

  await writeVariant("enhanced", (image) => {
    image.contrast(0.35);
    image.convolute(OCR_SHARPEN_KERNEL);
  });

  await writeVariant("threshold", (image) => {
    image.contrast(0.65);
    image.brightness(0.06);
    image.gaussian(1);
    image.threshold({ max: 180, autoGreyscale: false });
    image.convolute(OCR_SHARPEN_KERNEL);
  });

  await writeVariant("inverted-threshold", (image) => {
    image.contrast(0.7);
    image.brightness(0.08);
    image.gaussian(1);
    image.threshold({ max: 170, autoGreyscale: false });
    image.invert();
    image.convolute(OCR_SHARPEN_KERNEL);
  });

  return variants;
};

const runTesseractToText = async (inputPath: string, outputBase: string) => {
  const outputDir = path.dirname(outputBase);
  const outputBaseName = path.basename(outputBase);
  const attemptBase = path.join(outputDir, `${outputBaseName}-ocr-attempt`);
  const best = { text: "", score: -1, source: "none" };
  const commands = Array.from(new Set([TESSERACT_BIN, "tesseract"]));
  const psmModes = [4, 6, 11, 12];
  const preprocessedPaths: string[] = [];
  let hadNonMissingCommandError = false;
  let textractError: unknown = null;

  const considerCandidate = (
    text: string,
    source: string,
    options: OcrScoreOptions = {},
  ) => {
    const cleaned = cleanOcrText(text);
    const score = scoreOcrText(cleaned, { source, ...options });
    if (score > best.score) {
      best.text = cleaned;
      best.score = score;
      best.source = source;
    }
  };

  const tryCandidate = async (candidatePath: string) => {
    for (const command of commands) {
      for (const psm of psmModes) {
        try {
          const text = await runTesseractAttempt({
            command,
            inputPath: candidatePath,
            outputBase: attemptBase,
            psm,
          });
          considerCandidate(text, `${command}:psm${psm}`);
        } catch (error) {
          if (isMissingCommandError(error)) {
            continue;
          }
          hadNonMissingCommandError = true;
        }
      }
    }
  };

  const runTextractCandidate = async (candidatePath: string, source: string) => {
    const bytes = await readFile(candidatePath);
    const result = await detectTextFromImageBytesDetailed(bytes);
    considerCandidate(result.text, source, result);
    return result;
  };

  try {
    await tryCandidate(inputPath);

    let handwritingVariantPath: string | null = null;
    try {
      const preprocessedImages = await buildPreprocessedOcrImages(
        inputPath,
        outputDir,
        outputBaseName,
      );
      preprocessedPaths.push(...preprocessedImages.map((image) => image.path));
      handwritingVariantPath =
        preprocessedImages.find((image) => image.kind === "handwriting")?.path ??
        null;
      for (const preprocessedImage of preprocessedImages) {
        await tryCandidate(preprocessedImage.path);
      }
    } catch {
      // Image preprocessing is optional; continue with direct OCR result.
    }

    try {
      const textractResult = await runTextractCandidate(
        inputPath,
        "textract:original",
      );
      if (
        handwritingVariantPath &&
        (!textractResult.text.trim() ||
          textractResult.averageConfidence < 90 ||
          textractResult.lowConfidenceLineCount > 0)
      ) {
        await runTextractCandidate(
          handwritingVariantPath,
          "textract:handwriting",
        );
      }
    } catch (error) {
      textractError = error;
    }

    if (best.score >= MIN_OCR_TEXT_SCORE && best.text.trim()) {
      await writeFile(`${outputBase}.txt`, best.text, "utf8");
      return `${outputBase}.txt`;
    }

    if (best.text.trim()) {
      await writeFile(`${outputBase}.txt`, best.text, "utf8");
      return `${outputBase}.txt`;
    }

    const message =
      textractError instanceof Error
        ? textractError.message
        : "Textract OCR failed.";
    if (hadNonMissingCommandError) {
      throw new Error(`OCR failed. Tesseract/Textract error: ${message}`);
    }
    throw new Error(`Tesseract not available and Textract failed: ${message}`);
  } finally {
    await rm(`${attemptBase}.txt`, { force: true }).catch(() => undefined);
    for (const preprocessedPath of preprocessedPaths) {
      await rm(preprocessedPath, { force: true }).catch(() => undefined);
    }
  }
};

const translateText = async (text: string) => {
  if (!text.trim()) return text;
  const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: text,
      source: LIBRETRANSLATE_SOURCE,
      target: LIBRETRANSLATE_TARGET,
      format: "text",
      ...(LIBRETRANSLATE_API_KEY
        ? { api_key: LIBRETRANSLATE_API_KEY }
        : {}),
    }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`LibreTranslate error: ${message}`);
  }
  const data = (await response.json()) as { translatedText?: string };
  return data.translatedText ?? "";
};

const convertWithLibreOffice = async (
  inputPath: string,
  outputFormat: string,
  outputDir: string,
) => {
  const libreOffice = await getLibreOfficeCommand();
  await runCommand(libreOffice.command, [
    ...libreOffice.baseArgs,
    "--nologo",
    "--nolockcheck",
    "--norestore",
    "--invisible",
    "--headless",
    "--convert-to",
    outputFormat,
    "--outdir",
    outputDir,
    inputPath,
  ], { windowsHide: true });
  const base = path.basename(inputPath, path.extname(inputPath));
  return path.join(outputDir, `${base}.${outputFormat}`);
};

const buildDocxFromTextContent = async (text: string, outputPath: string) => {
  const lines = text.split(/\r?\n/);
  const children =
    lines.length > 0
      ? lines.map((line) => new Paragraph(line || ""))
      : [new Paragraph("")];
  const doc = new Document({
    sections: [{ children }],
  });
  const buffer = await Packer.toBuffer(doc);
  await writeFile(outputPath, buffer);
};

const buildDocxFromText = async (textPath: string, outputPath: string) => {
  const text = await readFile(textPath, "utf8");
  await buildDocxFromTextContent(text, outputPath);
};

const buildXlsxFromLines = async (lines: string[], outputPath: string) => {
  const XLSX = await getXlsxModule();
  const data = lines.length > 0 ? lines.map((line) => [line]) : [[""]];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, outputPath);
};

const ensureExists = async (filePath: string) => {
  await stat(filePath);
  return filePath;
};

const zipFiles = async (zipPath: string, files: string[]) => {
  try {
    await runCommand("zip", ["-j", zipPath, ...files]);
    return;
  } catch (error) {
    if (!isMissingCommandError(error)) {
      throw error;
    }
  }

  const JsZip = await getJsZipModule();
  const zip = new JsZip();
  await Promise.all(
    files.map(async (filePath) => {
      const data = await readFile(filePath);
      zip.file(path.basename(filePath), data);
    }),
  );
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  await writeFile(zipPath, buffer);
};

const zipDirectory = async (zipPath: string, dirPath: string) => {
  try {
    await runCommand("zip", ["-r", zipPath, "."], { cwd: dirPath });
    return;
  } catch (error) {
    if (!isMissingCommandError(error)) {
      throw error;
    }
  }

  const JsZip = await getJsZipModule();
  const zip = new JsZip();
  const base = path.resolve(dirPath);
  const walk = async (currentDir: string) => {
    const entries = await readdir(currentDir, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(currentDir, entry.name);
        const relPath = path
          .relative(base, entryPath)
          .replace(/\\/g, "/");
        if (entry.isDirectory()) {
          await walk(entryPath);
        } else if (entry.isFile()) {
          const data = await readFile(entryPath);
          zip.file(relPath, data);
        }
      }),
    );
  };
  await walk(base);
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  await writeFile(zipPath, buffer);
};

const runPdfToImages = async (
  inputPath: string,
  outputDir: string,
  base: string,
) => {
  const prefix = path.join(outputDir, base);
  try {
    await runCommand("pdftoppm", ["-jpeg", inputPath, prefix]);
    const files = await readdir(outputDir);
    return files
      .filter((file) => file.startsWith(`${base}-`) && file.endsWith(".jpg"))
      .sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
      )
      .map((file) => path.join(outputDir, file));
  } catch (error) {
    if (!isMissingCommandError(error)) {
      throw error;
    }
  }

  try {
    const pdfjs = await getPdfjsModule();
    const { createCanvas } = await getCanvasModule();
    const data = await readFile(inputPath);
    const loadingTask = pdfjs.getDocument({
      data: data instanceof Uint8Array ? data : new Uint8Array(data),
      disableWorker: true,
    });
    const pdf = await loadingTask.promise;
    const results: string[] = [];
    const scale = 2;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Unable to create 2D canvas context.");
      }
      await page.render({ canvasContext: ctx, viewport }).promise;
      const outputPath = path.join(outputDir, `${base}-${pageNumber}.jpg`);
      const buffer = canvas.toBuffer("image/jpeg", { quality: 0.92 });
      await writeFile(outputPath, buffer);
      results.push(outputPath);
    }

    if (typeof pdf.cleanup === "function") {
      pdf.cleanup();
    }
    if (typeof loadingTask.destroy === "function") {
      await loadingTask.destroy();
    }

    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    throw new Error(
      `pdftoppm not found and pdfjs fallback failed: ${message}`,
    );
  }
};

const runPdfToTextWithOcr = async (
  inputPath: string,
  outputDir: string,
  baseName: string,
) => {
  const pagesDir = path.join(
    outputDir,
    `${sanitizeFileName(baseName)}-pdf-ocr-pages`,
  );
  await ensureDir(pagesDir);

  try {
    const images = await runPdfToImages(inputPath, pagesDir, "page");
    if (images.length === 0) {
      return "";
    }

    const pageTexts: string[] = [];
    const safeBaseName = sanitizeFileName(baseName);
    for (let pageIndex = 0; pageIndex < images.length; pageIndex += 1) {
      const pageImagePath = images[pageIndex];
      if (!pageImagePath) {
        continue;
      }
      const pageOutputBase = path.join(
        pagesDir,
        `${safeBaseName}-ocr-page-${pageIndex + 1}`,
      );
      const textPath = await runTesseractToText(pageImagePath, pageOutputBase);
      const text = await readFile(textPath, "utf8");
      const cleaned = text.trim();
      if (cleaned.length > 0) {
        pageTexts.push(cleaned);
      }
    }

    return pageTexts.join("\n\n");
  } finally {
    await rm(pagesDir, { recursive: true, force: true }).catch(() => undefined);
  }
};

const runPdfToHtml = async (inputPath: string, outputDir: string) => {
  const prefix = path.join(outputDir, "index");
  await runCommand("pdftohtml", ["-q", "-s", "-i", inputPath, prefix]);
};

const runPdfTableExtract = async (inputPath: string, outputPath: string) => {
  const script = path.join(scriptsDir, "pdf_to_tables.py");
  await runPython([script, inputPath, outputPath]);
};

const runCsvToJson = async (inputPath: string, outputPath: string) => {
  const script = path.join(scriptsDir, "csv_to_json.py");
  await runPython([script, inputPath, outputPath]);
};

const runQrScan = async (inputPath: string) => {
  const { stdout } = await runCommand("zbarimg", ["--raw", "--quiet", inputPath]);
  return stdout.trim();
};

const runQrEncode = async (text: string, outputPath: string) => {
  await runCommand("qrencode", ["-o", outputPath, "-s", "8", "-m", "2", text]);
};

const isImg2PdfMissing = (error: unknown) => {
  if (isMissingCommandError(error)) return true;
  const message = error instanceof Error ? error.message : "";
  if (!message) return false;
  return (
    message.includes("Python 3 not found") ||
    message.includes("No module named") ||
    message.toLowerCase().includes("img2pdf")
  );
};

const runImageToPdfWithPdfLib = async (inputPath: string, outputPath: string) => {
  const ext = path.extname(inputPath).slice(1).toLowerCase();
  const bytes = await readFile(inputPath);
  const pdfDoc = await PDFDocument.create();
  let image;

  if (ext === "jpg" || ext === "jpeg") {
    image = await pdfDoc.embedJpg(bytes);
  } else if (ext === "png") {
    image = await pdfDoc.embedPng(bytes);
  } else {
    throw new Error(
      `Image to PDF fallback supports JPG or PNG only (received .${ext || "unknown"}).`,
    );
  }

  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  const pdfBytes = await pdfDoc.save();
  await writeFile(outputPath, pdfBytes);
};

const runImageToPdf = async (inputPath: string, outputPath: string) => {
  try {
    await runPython(["-m", "img2pdf", inputPath, "-o", outputPath]);
    return;
  } catch (error) {
    if (!isImg2PdfMissing(error)) {
      throw error;
    }
  }

  try {
    await runImageToPdfWithPdfLib(inputPath, outputPath);
  } catch (fallbackError) {
    if (fallbackError instanceof Error && fallbackError.message.includes("fallback supports")) {
      throw new Error(
        `${fallbackError.message} Install Python + img2pdf for TIFF or other formats.`,
      );
    }
    throw fallbackError;
  }
};

const buildOutputName = (base: string, ext: string) =>
  `${sanitizeFileName(base)}.${ext}`;

const ensureDir = async (dirPath: string) => {
  await mkdir(dirPath, { recursive: true });
};

const getPdfPageCount = async (pdfPath: string) => {
  const bytes = await readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(bytes);
  return pdfDoc.getPageCount();
};

const enforceDocumentPageLimit = async (pdfPath: string, fileName: string) => {
  const pageCount = await getPdfPageCount(pdfPath);
  if (pageCount > MAX_DOCUMENT_PAGES) {
    throw new Error(
      `${fileName} has ${pageCount} pages. Maximum allowed is ${MAX_DOCUMENT_PAGES} pages per document. Please use our Document Splitter to split the file and finish the job.`,
    );
  }
  return pageCount;
};

const processJob = async (jobId: string) => {
  const job = await getJobRecord(jobId);
  if (!job) {
    throw new Error("Job not found.");
  }

  const converter = getConverterBySlug(job.converterSlug);
  if (!converter) {
    throw new Error("Unknown converter slug.");
  }

  const workDir = await mkdtemp(path.join(tmpdir(), `umthethx-${jobId}-`));
  const inputDir = path.join(workDir, "inputs");
  const outputDir = path.join(workDir, "outputs");
  await ensureDir(inputDir);
  await ensureDir(outputDir);

  const outputs: JobOutput[] = [];
  const addOutput = async (localPath: string, filename: string) => {
    await ensureExists(localPath);
    const key = buildArtifactKey(jobId, filename);
    await uploadOutput(localPath, key);
    outputs.push({ key, filename });
    await updateJobRecord(jobId, { outputs });
  };

  const baseCounts = new Map<string, number>();
  const preparedInputs = await Promise.all(
    job.inputs.map(async (input, index) => {
      const safeName = sanitizeFileName(input.filename);
      const fileName = safeName || `input-${index + 1}`;
      const localPath = path.join(inputDir, `${index + 1}-${fileName}`);
      await downloadInput(input.key, localPath);
      const base = stripExtension(fileName) || `file-${index + 1}`;
      const count = (baseCounts.get(base) ?? 0) + 1;
      baseCounts.set(base, count);
      const uniqueBase = count > 1 ? `${base}-${count}` : base;
      return {
        ...input,
        safeName: fileName,
        baseName: uniqueBase,
        localPath,
      };
    }),
  );

  await updateJobRecord(jobId, { status: "processing", error: null });

  const handleOcrText = async (
    input: JobInput & { baseName: string; localPath: string },
    suffix?: string,
  ) => {
    const nameBase = suffix ? `${input.baseName}-${suffix}` : input.baseName;
    const inputExt = path.extname(input.localPath).slice(1).toLowerCase();
    const sourcePath =
      inputExt === "heic" || inputExt === "heif" || inputExt === "avif"
        ? await prepareConvertedImage(input, "ocr", "jpg")
        : input.localPath;
    const outputBase = path.join(outputDir, sanitizeFileName(nameBase));
    const outputPath = await runTesseractToText(sourcePath, outputBase);
    await addOutput(outputPath, buildOutputName(nameBase, "txt"));
  };

  const handleOcrDocx = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const inputExt = path.extname(input.localPath).slice(1).toLowerCase();
    const sourcePath =
      inputExt === "heic" || inputExt === "heif" || inputExt === "avif"
        ? await prepareConvertedImage(input, "ocr", "jpg")
        : input.localPath;
    const outputBase = path.join(outputDir, sanitizeFileName(input.baseName));
    const textPath = await runTesseractToText(sourcePath, outputBase);
    const docxPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.docx`,
    );
    await buildDocxFromText(textPath, docxPath);
    await addOutput(docxPath, buildOutputName(input.baseName, "docx"));
  };

  const handleOcrXlsx = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const inputExt = path.extname(input.localPath).slice(1).toLowerCase();
    const sourcePath =
      inputExt === "heic" || inputExt === "heif" || inputExt === "avif"
        ? await prepareConvertedImage(input, "ocr", "jpg")
        : input.localPath;
    const outputBase = path.join(outputDir, sanitizeFileName(input.baseName));
    const textPath = await runTesseractToText(sourcePath, outputBase);
    const text = await readFile(textPath, "utf8");
    const lines = text.split(/\r?\n/).filter(Boolean);
    const xlsxPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.xlsx`,
    );
    await buildXlsxFromLines(lines, xlsxPath);
    await addOutput(xlsxPath, buildOutputName(input.baseName, "xlsx"));
  };

  const decodeXmlEntities = (value: string) =>
    value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
      const normalized = entity.toLowerCase();
      if (normalized === "amp") return "&";
      if (normalized === "lt") return "<";
      if (normalized === "gt") return ">";
      if (normalized === "quot") return '"';
      if (normalized === "apos") return "'";

      if (normalized.startsWith("#x")) {
        const codePoint = Number.parseInt(normalized.slice(2), 16);
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
      }

      if (normalized.startsWith("#")) {
        const codePoint = Number.parseInt(normalized.slice(1), 10);
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
      }

      return match;
    });

  const extractSvgText = async (inputPath: string) => {
    const source = await readFile(inputPath, "utf8");
    const collectMatches = (pattern: RegExp) =>
      Array.from(source.matchAll(pattern))
        .map((match) => match[1] ?? "")
        .map((fragment) => fragment.replace(/<[^>]+>/g, " "))
        .map((fragment) => decodeXmlEntities(fragment))
        .map((fragment) => fragment.replace(/\s+/g, " ").trim())
        .filter(Boolean);

    const textLines = collectMatches(/<text\b[^>]*>([\s\S]*?)<\/text>/gi);
    const lines =
      textLines.length > 0
        ? textLines
        : collectMatches(
            /<(?:tspan|textPath)\b[^>]*>([\s\S]*?)<\/(?:tspan|textPath)>/gi,
          );

    return lines.join("\n");
  };

  const rasterizeSvgInput = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const outputPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}-rasterized.png`,
    );
    await runSvgToPng(input.localPath, outputPath);
    return outputPath;
  };

  const handleSvgToText = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const extractedText = await extractSvgText(input.localPath);
    const outputPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.txt`,
    );

    if (extractedText) {
      await writeFile(outputPath, extractedText, "utf8");
      await addOutput(outputPath, buildOutputName(input.baseName, "txt"));
      return;
    }

    const rasterPath = await rasterizeSvgInput(input);
    const outputBase = path.join(outputDir, sanitizeFileName(input.baseName));
    const textPath = await runTesseractToText(rasterPath, outputBase);
    await addOutput(textPath, buildOutputName(input.baseName, "txt"));
  };

  const handleImageTranslate = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const inputExt = path.extname(input.localPath).slice(1).toLowerCase();
    const sourcePath =
      inputExt === "heic" || inputExt === "heif"
        ? await prepareConvertedImage(input, "ocr", "jpg")
        : input.localPath;
    const outputBase = path.join(outputDir, sanitizeFileName(input.baseName));
    const textPath = await runTesseractToText(sourcePath, outputBase);
    const text = await readFile(textPath, "utf8");
    const translated = await translateText(text);
    const translatedPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.txt`,
    );
    await writeFile(translatedPath, translated, "utf8");
    await addOutput(translatedPath, buildOutputName(input.baseName, "txt"));
  };

  const extractPdfTextContent = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    await enforceDocumentPageLimit(input.localPath, input.filename);

    let extractedText = "";
    let pdftotextError: unknown;
    const extractPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}-extracted.txt`,
    );

    try {
      await runCommand("pdftotext", [input.localPath, extractPath]);
      extractedText = await readFile(extractPath, "utf8");
    } catch (error) {
      pdftotextError = error;
    }

    const extractedScore = scoreOcrText(extractedText);
    if (extractedScore < MIN_PDF_EXTRACTED_TEXT_SCORE) {
      try {
        const ocrText = await runPdfToTextWithOcr(
          input.localPath,
          outputDir,
          input.baseName,
        );
        if (scoreOcrText(ocrText) > extractedScore) {
          extractedText = ocrText;
        }
      } catch (ocrError) {
        if (pdftotextError) {
          const pdftotextMessage =
            pdftotextError instanceof Error
              ? pdftotextError.message
              : "pdftotext failed.";
          const ocrMessage =
            ocrError instanceof Error ? ocrError.message : "OCR failed.";
          throw new Error(
            `PDF text extraction failed. ${pdftotextMessage} OCR fallback: ${ocrMessage}`,
          );
        }
      }
    }

    return extractedText;
  };

  const handlePdfToText = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const extractedText = await extractPdfTextContent(input);

    const outputPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.txt`,
    );

    await writeFile(outputPath, extractedText, "utf8");
    await addOutput(outputPath, buildOutputName(input.baseName, "txt"));
  };

  const handlePdfToDocx = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const extractedText = await extractPdfTextContent(input);
    const outputPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.docx`,
    );
    await buildDocxFromTextContent(extractedText, outputPath);
    await addOutput(outputPath, buildOutputName(input.baseName, "docx"));
  };

  const handlePdfTables = async (
    input: JobInput & { baseName: string; localPath: string },
    format: "csv" | "xlsx",
  ) => {
    await enforceDocumentPageLimit(input.localPath, input.filename);

    const outputPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.${format}`,
    );
    await runPdfTableExtract(input.localPath, outputPath);
    await addOutput(outputPath, buildOutputName(input.baseName, format));
  };

  const handlePdfToJpg = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    await enforceDocumentPageLimit(input.localPath, input.filename);

    const pageDir = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}-pages`,
    );
    await ensureDir(pageDir);
    const images = await runPdfToImages(input.localPath, pageDir, "page");
    if (images.length === 0) {
      throw new Error("No pages rendered.");
    }
    if (images.length === 1) {
      const single = images[0];
      if (!single) {
        throw new Error("No pages rendered.");
      }
      await addOutput(single, `${sanitizeFileName(input.baseName)}.jpg`);
      return;
    }
    const zipPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}-pages.zip`,
    );
    await zipFiles(zipPath, images);
    await addOutput(zipPath, `${sanitizeFileName(input.baseName)}-pages.zip`);
  };

  const handlePdfToImageFormat = async (
    input: JobInput & { baseName: string; localPath: string },
    format: "jpeg" | "png" | "tiff" | "heic" | "heif" | "avif",
  ) => {
    await enforceDocumentPageLimit(input.localPath, input.filename);

    const pageDir = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}-pages`,
    );
    await ensureDir(pageDir);
    const images = await runPdfToImages(input.localPath, pageDir, "page");
    if (images.length === 0) {
      throw new Error("No pages rendered.");
    }

    const convertedPages = await Promise.all(
      images.map(async (imagePath, pageIndex) => {
        const outputPath = path.join(
          pageDir,
          `${sanitizeFileName(input.baseName)}-page-${pageIndex + 1}.${format}`,
        );
        if (format === "jpeg") {
          await copyFile(imagePath, outputPath);
          return outputPath;
        }
        await runImageConvert(imagePath, outputPath);
        return outputPath;
      }),
    );

    if (convertedPages.length === 1) {
      const single = convertedPages[0];
      if (!single) {
        throw new Error("No pages rendered.");
      }
      await addOutput(single, `${sanitizeFileName(input.baseName)}.${format}`);
      return;
    }

    const zipPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}-pages.zip`,
    );
    await zipFiles(zipPath, convertedPages);
    await addOutput(zipPath, `${sanitizeFileName(input.baseName)}-pages.zip`);
  };

  const handlePdfSplit = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const bytes = await readFile(input.localPath);
    const pdfDoc = await PDFDocument.load(bytes);
    const pageCount = pdfDoc.getPageCount();
    if (pageCount > MAX_DOCUMENT_PAGES) {
      throw new Error(
        `${input.filename} has ${pageCount} pages. Maximum allowed is ${MAX_DOCUMENT_PAGES} pages per document. Please use our Document Splitter to split the file and finish the job.`,
      );
    }
    if (pageCount === 0) {
      throw new Error("No pages found.");
    }
    if (pageCount === 1) {
      const singleDoc = await PDFDocument.create();
      const [page] = await singleDoc.copyPages(pdfDoc, [0]);
      if (!page) {
        throw new Error("No pages found.");
      }
      singleDoc.addPage(page);
      const outputPath = path.join(
        outputDir,
        `${sanitizeFileName(input.baseName)}.pdf`,
      );
      const pdfBytes = await singleDoc.save();
      await writeFile(outputPath, pdfBytes);
      await addOutput(outputPath, buildOutputName(input.baseName, "pdf"));
      return;
    }

    const pageDir = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}-pages`,
    );
    await ensureDir(pageDir);
    const pageFiles: string[] = [];
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const splitDoc = await PDFDocument.create();
      const [page] = await splitDoc.copyPages(pdfDoc, [pageIndex]);
      if (!page) {
        continue;
      }
      splitDoc.addPage(page);
      const outputPath = path.join(
        pageDir,
        `${sanitizeFileName(input.baseName)}-page-${pageIndex + 1}.pdf`,
      );
      const pdfBytes = await splitDoc.save();
      await writeFile(outputPath, pdfBytes);
      pageFiles.push(outputPath);
    }

    if (pageFiles.length === 0) {
      throw new Error("No pages split.");
    }

    const zipPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}-pages.zip`,
    );
    await zipFiles(zipPath, pageFiles);
    await addOutput(zipPath, `${sanitizeFileName(input.baseName)}-pages.zip`);
  };

  const handleOfficeToJpg = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const pdfPath = await convertWithLibreOffice(
      input.localPath,
      "pdf",
      outputDir,
    );
    await enforceDocumentPageLimit(pdfPath, input.filename);
    const pageDir = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}-pages`,
    );
    await ensureDir(pageDir);
    const images = await runPdfToImages(pdfPath, pageDir, "page");
    if (images.length === 0) {
      throw new Error("No pages rendered.");
    }
    if (images.length === 1) {
      const single = images[0];
      if (!single) {
        throw new Error("No pages rendered.");
      }
      await addOutput(single, `${sanitizeFileName(input.baseName)}.jpg`);
      return;
    }
    const zipPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}-pages.zip`,
    );
    await zipFiles(zipPath, images);
    await addOutput(zipPath, `${sanitizeFileName(input.baseName)}-pages.zip`);
  };

  const handlePdfToHtml = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    await enforceDocumentPageLimit(input.localPath, input.filename);

    const htmlDir = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}-html`,
    );
    await ensureDir(htmlDir);
    await runPdfToHtml(input.localPath, htmlDir);
    const zipPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}-html.zip`,
    );
    await zipDirectory(zipPath, htmlDir);
    await addOutput(zipPath, `${sanitizeFileName(input.baseName)}-html.zip`);
  };

  async function prepareConvertedImage(
    input: JobInput & { baseName: string; localPath: string },
    suffix: string,
    format: "jpg" | "jpeg" | "png",
  ) {
    const outputPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}-${suffix}.${format}`,
    );
    await runImageConvert(input.localPath, outputPath);
    return outputPath;
  }

  const handleImageConvert = async (
    input: JobInput & { baseName: string; localPath: string },
    format: "png" | "jpg" | "jpeg" | "tiff" | "heic" | "heif" | "avif",
  ) => {
    const outputPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.${format}`,
    );
    await runImageConvert(input.localPath, outputPath);
    await addOutput(outputPath, buildOutputName(input.baseName, format));
  };

  const escapeXmlAttribute = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");

  const prepareSvgEmbedAsset = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const ext = path.extname(input.localPath).slice(1).toLowerCase();
    const canEmbedDirectly = ext === "png" || ext === "jpg" || ext === "jpeg";
    const assetPath = canEmbedDirectly
      ? input.localPath
      : path.join(
          outputDir,
          `${sanitizeFileName(input.baseName)}-svg-embed.png`,
        );

    if (!canEmbedDirectly) {
      await runImageConvert(input.localPath, assetPath);
    }

    const jimp = await getJimpModule();
    const image = await jimp.read(assetPath);
    const mimeType = getContentType(assetPath);
    const data = await readFile(assetPath);

    return {
      dataUrl: `data:${mimeType};base64,${data.toString("base64")}`,
      width: image.getWidth(),
      height: image.getHeight(),
    };
  };

  const handleImageToSvg = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const asset = await prepareSvgEmbedAsset(input);
    const outputPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.svg`,
    );
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${asset.width}" height="${asset.height}" viewBox="0 0 ${asset.width} ${asset.height}"><image href="${escapeXmlAttribute(asset.dataUrl)}" width="${asset.width}" height="${asset.height}" preserveAspectRatio="xMidYMid meet" /></svg>`;
    await writeFile(outputPath, svg, "utf8");
    await addOutput(outputPath, buildOutputName(input.baseName, "svg"));
  };

  const handleSvgToPng = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const outputPath = await rasterizeSvgInput(input);
    await addOutput(outputPath, buildOutputName(input.baseName, "png"));
  };

  const handleSvgToJpeg = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const rasterPath = await rasterizeSvgInput(input);
    const outputPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.jpeg`,
    );
    await runImageConvert(rasterPath, outputPath);
    await addOutput(outputPath, buildOutputName(input.baseName, "jpeg"));
  };

  const handleSvgToHeic = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const rasterPath = await rasterizeSvgInput(input);
    const outputPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.heic`,
    );
    await runImageConvert(rasterPath, outputPath);
    await addOutput(outputPath, buildOutputName(input.baseName, "heic"));
  };

  const handleImageToPdf = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const inputExt = path.extname(input.localPath).slice(1).toLowerCase();
    let sourcePath = input.localPath;

    if (inputExt === "heic" || inputExt === "heif") {
      sourcePath = await prepareConvertedImage(input, "pdf", "jpg");
    } else if (inputExt === "svg") {
      sourcePath = await rasterizeSvgInput(input);
    } else if (inputExt !== "jpg" && inputExt !== "jpeg" && inputExt !== "png") {
      sourcePath = await prepareConvertedImage(input, "pdf", "png");
    }

    const outputPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.pdf`,
    );
    await runImageToPdf(sourcePath, outputPath);
    await addOutput(outputPath, buildOutputName(input.baseName, "pdf"));
  };

  const handleQrScan = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const decoded = await runQrScan(input.localPath);
    const outputPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.txt`,
    );
    await writeFile(outputPath, decoded || "", "utf8");
    await addOutput(outputPath, buildOutputName(input.baseName, "txt"));
  };

  const handleQrGenerate = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const text = await readFile(input.localPath, "utf8");
    const outputPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.png`,
    );
    await runQrEncode(text.trim() || " ", outputPath);
    await addOutput(outputPath, buildOutputName(input.baseName, "png"));
  };

  const handleCsvToJson = async (
    input: JobInput & { baseName: string; localPath: string },
  ) => {
    const outputPath = path.join(
      outputDir,
      `${sanitizeFileName(input.baseName)}.json`,
    );
    await runCsvToJson(input.localPath, outputPath);
    await addOutput(outputPath, buildOutputName(input.baseName, "json"));
  };

  try {
    if (converter.slug === "merge-pdf") {
      if (preparedInputs.length < 2) {
        throw new Error("Merge PDF requires at least two files.");
      }
      for (const input of preparedInputs) {
        await enforceDocumentPageLimit(input.localPath, input.filename);
      }
      const outputPath = path.join(outputDir, "merged.pdf");
      await runCommand("pdfunite", [
        ...preparedInputs.map((input) => input.localPath),
        outputPath,
      ]);
      await addOutput(outputPath, "merged.pdf");
    } else {
      for (const input of preparedInputs) {
        switch (converter.slug) {
          case "image-to-text":
          case "jpeg-to-text":
          case "png-to-text":
          case "heic-to-text":
          case "heif-to-text":
          case "avif-to-text":
          case "tiff-to-text":
            await handleOcrText(input);
            break;
          case "svg-to-text":
            await handleSvgToText(input);
            break;
          case "jpg-to-word":
          case "heic-to-word":
          case "heif-to-word":
          case "avif-to-docx":
          case "png-to-document":
          case "tiff-to-word":
            await handleOcrDocx(input);
            break;
          case "jpg-to-excel":
          case "png-to-xlsx":
          case "avif-to-xlsx":
          case "heic-to-xlsx":
          case "heif-to-xlsx":
          case "tiff-to-xlsx":
            await handleOcrXlsx(input);
            break;
          case "pdf-to-text":
            await handlePdfToText(input);
            break;
          case "pdf-to-docx":
            await handlePdfToDocx(input);
            break;
          case "pdf-to-csv":
            await handlePdfTables(input, "csv");
            break;
          case "pdf-to-excel":
          case "pdf-to-xlsx":
            await handlePdfTables(input, "xlsx");
            break;
          case "word-to-pdf":
          case "text-to-pdf":
          case "html-to-pdf": {
            const outputPath = await convertWithLibreOffice(
              input.localPath,
              "pdf",
              outputDir,
            );
            await enforceDocumentPageLimit(outputPath, input.filename);
            await addOutput(outputPath, buildOutputName(input.baseName, "pdf"));
            break;
          }
          case "pdf-to-jpg":
            await handlePdfToJpg(input);
            break;
          case "pdf-to-jpeg":
            await handlePdfToImageFormat(input, "jpeg");
            break;
          case "pdf-to-png":
            await handlePdfToImageFormat(input, "png");
            break;
          case "pdf-to-tiff":
            await handlePdfToImageFormat(input, "tiff");
            break;
          case "pdf-to-heic":
            await handlePdfToImageFormat(input, "heic");
            break;
          case "pdf-to-heif":
            await handlePdfToImageFormat(input, "heif");
            break;
          case "pdf-to-avif":
            await handlePdfToImageFormat(input, "avif");
            break;
          case "split-pdf":
            await handlePdfSplit(input);
            break;
          case "word-to-jpg":
          case "excel-to-jpg":
            await handleOfficeToJpg(input);
            break;
          case "pdf-to-html":
            await handlePdfToHtml(input);
            break;
          case "jpeg-to-png":
          case "avif-to-png":
          case "webp-to-png":
            await handleImageConvert(input, "png");
            break;
          case "jpeg-to-avif":
          case "png-to-avif":
          case "heic-to-avif":
            await handleImageConvert(input, "avif");
            break;
          case "jpeg-to-heic":
          case "avif-to-heic":
            await handleImageConvert(input, "heic");
            break;
          case "png-to-jpg":
          case "heic-to-jpg":
            await handleImageConvert(input, "jpg");
            break;
          case "heif-to-jpeg":
            await handleImageConvert(input, "jpeg");
            break;
          case "heif-to-png":
            await handleImageConvert(input, "png");
            break;
          case "avif-to-jpeg":
          case "webp-to-jpeg":
            await handleImageConvert(input, "jpeg");
            break;
          case "png-to-svg":
          case "jpeg-to-svg":
          case "heic-to-svg":
          case "webp-to-svg":
            await handleImageToSvg(input);
            break;
          case "svg-to-png":
            await handleSvgToPng(input);
            break;
          case "svg-to-jpeg":
            await handleSvgToJpeg(input);
            break;
          case "svg-to-heic":
            await handleSvgToHeic(input);
            break;
          case "heic-to-pdf":
          case "heif-to-pdf":
          case "tiff-to-pdf":
          case "jpg-to-pdf":
          case "png-to-pdf":
          case "avif-to-pdf":
          case "webp-to-pdf":
          case "svg-to-pdf":
            await handleImageToPdf(input);
            break;
          case "qr-code-scanner":
          case "barcode-scanner":
            await handleQrScan(input);
            break;
          case "qr-code-generator":
            await handleQrGenerate(input);
            break;
          case "csv-to-json":
            await handleCsvToJson(input);
            break;
          default:
            throw new Error(`Unsupported converter: ${converter.slug}`);
        }
      }
    }

    await updateJobRecord(jobId, { status: "completed", outputs });
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
};

const connection = getRedisConnection();

console.log(
  `[worker] starting converter worker for queue "${QUEUE_NAME}" with keepalive ${WORKER_KEEPALIVE_MS}ms (redis=${describeRedisTarget()}, bucket=${bucket}, region=${process.env.AWS_REGION?.trim() || "unknown"})`,
);

const worker = new Worker(
  QUEUE_NAME,
  async (bullJob) => {
    const jobId = (bullJob.data as { jobId?: string }).jobId;
    if (!jobId) {
      throw new Error("Missing jobId.");
    }
    try {
      await processJob(jobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Job failed.";
      await updateJobRecord(jobId, { status: "failed", error: message });
      throw error;
    }
  },
  {
    connection: connection as unknown as ConnectionOptions,
    concurrency: 1,
  },
);

const keepAliveTimer = setInterval(() => {
  connection.ping().catch((error) => {
    console.error("[worker] redis keepalive ping failed", error);
  });
}, WORKER_KEEPALIVE_MS);

keepAliveTimer.unref();

worker.on("ready", () => {
  console.log(`[worker] ready and waiting for jobs on "${QUEUE_NAME}"`);
});

worker.on("active", (bullJob) => {
  const jobId = (bullJob.data as { jobId?: string }).jobId ?? bullJob.id;
  console.log(`[worker] claimed job ${jobId}`);
});

worker.on("completed", (bullJob) => {
  const jobId = (bullJob.data as { jobId?: string }).jobId ?? bullJob.id;
  console.log(`[worker] completed job ${jobId}`);
});

worker.on("failed", async (bullJob, error) => {
  const jobId = (bullJob?.data as { jobId?: string })?.jobId;
  console.error(
    `[worker] failed job ${jobId ?? bullJob?.id ?? "unknown"}`,
    error,
  );
  if (jobId) {
    await updateJobRecord(jobId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Job failed.",
    });
  }
});

worker.on("error", (error) => {
  console.error("[worker] worker error", error);
});

worker.on("stalled", (jobId) => {
  console.warn(`[worker] stalled job ${jobId}`);
});

let shuttingDown = false;

const shutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(keepAliveTimer);
  console.log("[worker] shutting down");
  await worker.close();
  await connection.quit();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
