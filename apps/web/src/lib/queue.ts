import { Queue, type ConnectionOptions } from "bullmq";
import IORedis, { type RedisOptions } from "ioredis";
import { getConverterBySlug } from "./converters";

type EnvKey =
  | "REDIS_URL"
  | "REDIS_HOST"
  | "REDIS_PORT"
  | "REDIS_PASSWORD"
  | "REDIS_USERNAME"
  | "REDIS_TLS"
  | "UPSTASH_REDIS_REST_URL"
  | "UPSTASH_REDIS_REST_TOKEN";

const readEnv = (key: EnvKey) => process.env[key]?.trim();

export const HEAVY_QUEUE_NAME = "converter-jobs-heavy";
export const LIGHT_QUEUE_NAME = "converter-jobs-light";
export const CLEANUP_QUEUE_NAME = "converter-jobs-cleanup";
export const DEFAULT_JOB_RETENTION_MS = 15 * 60 * 1000;

export type ConvertQueueTier = "heavy" | "light";

const HEAVY_ENGINE_HINTS = new Set([
  "tesseract",
  "svg-text",
  "ocr-docx",
  "ocr-xlsx",
  "pdf-text-extract",
  "pdf-table-extract",
  "pdf-docx",
  "pdf-image",
  "pdf-merge",
  "pdf-split",
  "pdf-html",
  "libreoffice",
  "chrome-print",
]);

const isTruthy = (value: string) =>
  ["1", "true", "yes", "on"].includes(value.toLowerCase());

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

const parseRedisPort = (value: string | undefined) => {
  if (!value) return 6379;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("REDIS_PORT must be a positive integer.");
  }
  return parsed;
};

const getUpstashHostFromRestUrl = () => {
  const restUrl = readEnv("UPSTASH_REDIS_REST_URL");
  if (!restUrl) return undefined;
  try {
    return new URL(restUrl).hostname;
  } catch {
    throw new Error("UPSTASH_REDIS_REST_URL must be a valid URL.");
  }
};

const shouldUseTls = (host?: string, url?: string) => {
  const explicitTls = readEnv("REDIS_TLS");
  if (explicitTls) {
    return isTruthy(explicitTls);
  }
  if (url) {
    return url.startsWith("rediss://");
  }
  return host?.endsWith(".upstash.io") ?? false;
};

const validateRedisUrl = (value: string) => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      "REDIS_URL must be a valid redis:// or rediss:// URL.",
    );
  }

  if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
    throw new Error(
      "REDIS_URL must start with redis:// or rediss://.",
    );
  }

  if (!parsed.hostname) {
    throw new Error("REDIS_URL must include a hostname.");
  }

  return parsed;
};

const buildRedisOptions = (useTls: boolean): RedisOptions => ({
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  connectTimeout: 10_000,
  ...(useTls ? { tls: {} } : {}),
});

export const getRedisConnection = () => {
  const redisUrl = readEnv("REDIS_URL");
  if (redisUrl) {
    validateRedisUrl(redisUrl);
    return new IORedis(
      redisUrl,
      buildRedisOptions(shouldUseTls(undefined, redisUrl)),
    );
  }

  const host = readEnv("REDIS_HOST") ?? getUpstashHostFromRestUrl();
  if (!host) {
    throw new Error(
      "Missing Redis config: set REDIS_URL or REDIS_HOST. Upstash users can also provide UPSTASH_REDIS_REST_URL.",
    );
  }

  const password =
    readEnv("REDIS_PASSWORD") ?? readEnv("UPSTASH_REDIS_REST_TOKEN");
  if (!password && host.endsWith(".upstash.io")) {
    throw new Error(
      "Missing Redis config: set REDIS_PASSWORD or UPSTASH_REDIS_REST_TOKEN for Upstash.",
    );
  }

  return new IORedis({
    host,
    port: parseRedisPort(readEnv("REDIS_PORT")),
    username: readEnv("REDIS_USERNAME"),
    password,
    ...buildRedisOptions(shouldUseTls(host)),
  });
};

export const getQueue = (queueName: string) =>
  new Queue(queueName, {
    connection: getRedisConnection() as unknown as ConnectionOptions,
  });

export const getQueueTierForConverterSlug = (
  converterSlug: string,
): ConvertQueueTier => {
  const converter = getConverterBySlug(converterSlug);
  if (!converter) {
    throw new Error("Unknown converter slug.");
  }

  const isHeavyByTag = converter.categoryTags.includes("pdf");
  const isHeavyByJobType = converter.jobType === "ocr";
  const isHeavyByEngine = HEAVY_ENGINE_HINTS.has(converter.engineHint);

  return isHeavyByTag || isHeavyByJobType || isHeavyByEngine
    ? "heavy"
    : "light";
};

export const getConvertQueueName = (converterSlug: string) =>
  getQueueTierForConverterSlug(converterSlug) === "heavy"
    ? HEAVY_QUEUE_NAME
    : LIGHT_QUEUE_NAME;

export const JOB_RETENTION_MS = parsePositiveInteger(
  process.env.JOB_RETENTION_MS?.trim(),
  DEFAULT_JOB_RETENTION_MS,
);

export const scheduleJobCleanup = async (
  jobId: string,
  delayMs = JOB_RETENTION_MS,
) => {
  const queue = getQueue(CLEANUP_QUEUE_NAME);
  try {
    await queue.add(
      "cleanup",
      { jobId },
      {
        jobId: `cleanup:${jobId}`,
        delay: Math.max(delayMs, 0),
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 60_000,
        },
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    );
  } finally {
    await queue.close().catch(() => undefined);
  }
};
