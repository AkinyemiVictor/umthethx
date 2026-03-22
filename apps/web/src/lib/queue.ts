import { Queue, type ConnectionOptions } from "bullmq";
import IORedis, { type RedisOptions } from "ioredis";

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

export const QUEUE_NAME = "converter-jobs";

const isTruthy = (value: string) =>
  ["1", "true", "yes", "on"].includes(value.toLowerCase());

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

const buildRedisOptions = (useTls: boolean): RedisOptions => ({
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  connectTimeout: 10_000,
  ...(useTls ? { tls: {} } : {}),
});

export const getRedisConnection = () => {
  const redisUrl = readEnv("REDIS_URL");
  if (redisUrl) {
    return new IORedis(redisUrl, buildRedisOptions(shouldUseTls(undefined, redisUrl)));
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

export const getQueue = () =>
  new Queue(QUEUE_NAME, {
    connection: getRedisConnection() as unknown as ConnectionOptions,
  });
