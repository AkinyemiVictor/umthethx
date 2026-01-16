import { Queue } from "bullmq";
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

export const getRedisConnection = () =>
  new IORedis(requireEnv("REDIS_URL"), {
    maxRetriesPerRequest: null,
  });

export const getQueue = () =>
  new Queue(QUEUE_NAME, {
    connection: getRedisConnection(),
  });
