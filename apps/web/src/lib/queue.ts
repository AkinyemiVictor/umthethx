import PQueue from "p-queue";
import { getConverterBySlug } from "./converters";
import { updateJobRecord } from "./job-store";
import { deleteS3Prefix } from "./s3";

export const HEAVY_QUEUE_NAME = "converter-jobs-heavy";
export const LIGHT_QUEUE_NAME = "converter-jobs-light";
export const CLEANUP_QUEUE_NAME = "converter-jobs-cleanup";
export const DEFAULT_JOB_RETENTION_MS = 15 * 60 * 1000;

export type ConvertQueueTier = "heavy" | "light";

type QueueJobData = {
  jobId?: string;
};

type QueueAddOptions = {
  delay?: number;
  jobId?: string;
  removeOnComplete?: number;
  removeOnFail?: number;
};

type LocalQueue = {
  add: (
    _name: string,
    data: QueueJobData,
    options?: QueueAddOptions,
  ) => Promise<void>;
  close: () => Promise<void>;
};

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

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

const HEAVY_WORKER_CONCURRENCY = parsePositiveInteger(
  process.env.HEAVY_WORKER_CONCURRENCY?.trim() ||
    process.env.WORKER_CONCURRENCY?.trim(),
  1,
);
const LIGHT_WORKER_CONCURRENCY = parsePositiveInteger(
  process.env.LIGHT_WORKER_CONCURRENCY?.trim(),
  4,
);
const CLEANUP_WORKER_CONCURRENCY = parsePositiveInteger(
  process.env.CLEANUP_WORKER_CONCURRENCY?.trim(),
  2,
);
const HEAVY_WORKER_INPUT_CONCURRENCY = parsePositiveInteger(
  process.env.HEAVY_WORKER_INPUT_CONCURRENCY?.trim() ||
    process.env.WORKER_INPUT_CONCURRENCY?.trim(),
  1,
);
const LIGHT_WORKER_INPUT_CONCURRENCY = parsePositiveInteger(
  process.env.LIGHT_WORKER_INPUT_CONCURRENCY?.trim(),
  1,
);

export const JOB_RETENTION_MS = parsePositiveInteger(
  process.env.JOB_RETENTION_MS?.trim(),
  DEFAULT_JOB_RETENTION_MS,
);

const queues: Record<string, PQueue> = {
  [HEAVY_QUEUE_NAME]: new PQueue({ concurrency: HEAVY_WORKER_CONCURRENCY }),
  [LIGHT_QUEUE_NAME]: new PQueue({ concurrency: LIGHT_WORKER_CONCURRENCY }),
  [CLEANUP_QUEUE_NAME]: new PQueue({ concurrency: CLEANUP_WORKER_CONCURRENCY }),
};
let queueShutdownHandlersRegistered = false;

const processConvertJob = async (jobId: string, inputConcurrency: number) => {
  try {
    const { processJob } = await import("../../worker/convert-worker");
    await processJob(jobId, { inputConcurrency });
    await scheduleJobCleanup(jobId).catch((error) => {
      console.error(`failed to schedule cleanup for job ${jobId}`, error);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job failed.";
    await updateJobRecord(jobId, { status: "failed", error: message }).catch(
      () => undefined,
    );
    await scheduleJobCleanup(jobId).catch((scheduleError) => {
      console.error(
        `failed to schedule cleanup for failed job ${jobId}`,
        scheduleError,
      );
    });
    throw error;
  }
};

const runQueueJob = async (queueName: string, data: QueueJobData) => {
  const jobId = data.jobId;
  if (!jobId) {
    throw new Error("Missing jobId.");
  }

  if (queueName === CLEANUP_QUEUE_NAME) {
    await deleteS3Prefix({ prefix: `temp/${jobId}/` });
    return;
  }

  const inputConcurrency =
    queueName === HEAVY_QUEUE_NAME
      ? HEAVY_WORKER_INPUT_CONCURRENCY
      : LIGHT_WORKER_INPUT_CONCURRENCY;
  await processConvertJob(jobId, inputConcurrency);
};

export const getQueue = (queueName: string): LocalQueue => {
  const queue = queues[queueName];
  if (!queue) {
    throw new Error(`Unknown queue: ${queueName}`);
  }

  return {
    add: async (_name, data, options) => {
      const enqueue = () => {
        queue
          .add(() => runQueueJob(queueName, data))
          .catch((error: unknown) => {
            console.error(`local queue "${queueName}" job failed`, error);
          });
      };
      if (options?.delay) {
        const timer = setTimeout(enqueue, Math.max(options.delay, 0));
        timer.unref?.();
        return;
      }
      enqueue();
    },
    close: async () => undefined,
  };
};

export const shutdownLocalQueues = async () => {
  for (const queue of Object.values(queues)) {
    queue.pause();
    queue.clear();
  }
  await Promise.allSettled(
    Object.values(queues).map((queue) => queue.onIdle()),
  );
};

const registerQueueShutdownHandlers = () => {
  if (queueShutdownHandlersRegistered) return;
  queueShutdownHandlersRegistered = true;

  const shutdown = () => {
    void shutdownLocalQueues().catch((error: unknown) => {
      console.error("failed to shut down local queues", error);
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
};

registerQueueShutdownHandlers();

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

export const scheduleJobCleanup = async (
  jobId: string,
  delayMs = JOB_RETENTION_MS,
) => {
  const queue = getQueue(CLEANUP_QUEUE_NAME);
  await queue.add("cleanup", { jobId }, { delay: delayMs });
};
