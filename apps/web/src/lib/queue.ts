import { Queue, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

type EnvKey = "REDIS_URL";

const requireEnv = (key: EnvKey) => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
};

export const QUEUE_NAME = "converter-jobs";

const buildRedisOptions = (url: string) => ({
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  connectTimeout: 10_000,
  ...(url.startsWith("rediss://") ? { tls: {} } : {}),
});

export const getRedisConnection = () => {
  const redisUrl = requireEnv("REDIS_URL");
  return new IORedis(redisUrl, buildRedisOptions(redisUrl));
};

export const getQueue = () =>
  new Queue(QUEUE_NAME, {
    connection: getRedisConnection() as unknown as ConnectionOptions,
  });
