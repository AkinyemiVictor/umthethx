import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "./env";

export const QUEUE_NAME = "converter-jobs";

export const getRedisConnection = () =>
  new IORedis(env.get("REDIS_URL"), {
    maxRetriesPerRequest: null,
  });

export const getQueue = () =>
  new Queue(QUEUE_NAME, {
    connection: getRedisConnection(),
  });
