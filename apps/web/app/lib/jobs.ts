export type JobStatus = "queued" | "running" | "success" | "error";

export type ConverterJobPayload = {
  converterSlug: string;
  inputKey: string;
  fileName?: string;
  options?: Record<string, unknown>;
  plan?: "free" | "pro";
  outputKey?: string;
};

export const JOB_TABLE = "conversion_jobs";
