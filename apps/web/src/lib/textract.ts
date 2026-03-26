import {
  DetectDocumentTextCommand,
  GetDocumentTextDetectionCommand,
  StartDocumentTextDetectionCommand,
  TextractClient,
  type Block,
} from "@aws-sdk/client-textract";

type EnvKey =
  | "AWS_REGION"
  | "AWS_ACCESS_KEY_ID"
  | "AWS_SECRET_ACCESS_KEY";

const requireEnv = (key: EnvKey) => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
};

let cachedClient: TextractClient | null = null;

const getTextractClient = () => {
  if (!cachedClient) {
    cachedClient = new TextractClient({
      region: requireEnv("AWS_REGION"),
      credentials: {
        accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }
  return cachedClient;
};

const commonShortWords = new Set([
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

const normalizeLine = (value: string) =>
  value
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

const isLikelyNoiseLine = (text: string, confidence: number) => {
  if (!/[A-Za-z0-9]/.test(text)) return true;
  if (/^[|\\/_\-.,:;"'`~()[\]{}=+*]+$/.test(text)) return true;

  const compact = text.replace(/\s+/g, "");
  if (compact.length === 1) {
    return true;
  }

  if (/^[A-Za-z]{1,2}$/.test(compact)) {
    return confidence < 88 && !commonShortWords.has(compact.toLowerCase());
  }

  return false;
};

const extractLines = (blocks?: Block[]) => {
  const lines = (blocks ?? [])
    .filter((block) => block.BlockType === "LINE" && block.Text)
    .map((block) => ({
      text: normalizeLine(block.Text ?? ""),
      confidence: block.Confidence ?? 100,
      page: block.Page ?? 1,
      top: block.Geometry?.BoundingBox?.Top ?? 0,
      left: block.Geometry?.BoundingBox?.Left ?? 0,
    }))
    .filter((line) => Boolean(line.text))
    .sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page;
      const topDiff = a.top - b.top;
      if (Math.abs(topDiff) > 0.012) return topDiff;
      return a.left - b.left;
    });

  const cleaned: string[] = [];
  for (const line of lines) {
    if (isLikelyNoiseLine(line.text, line.confidence)) {
      continue;
    }
    if (cleaned[cleaned.length - 1] === line.text) {
      continue;
    }
    cleaned.push(line.text);
  }

  return cleaned.join("\n");
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const detectTextFromImageBytes = async (buffer: Uint8Array) => {
  const response = await getTextractClient().send(
    new DetectDocumentTextCommand({
      Document: { Bytes: buffer },
    }),
  );
  return extractLines(response.Blocks);
};

export const detectTextFromPdfS3 = async (
  bucket: string,
  key: string,
  options?: { maxWaitMs?: number },
) => {
  const maxWaitMs = options?.maxWaitMs ?? 180_000;
  const startResponse = await getTextractClient().send(
    new StartDocumentTextDetectionCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: bucket,
          Name: key,
        },
      },
    }),
  );

  if (!startResponse.JobId) {
    throw new Error("Textract did not return a job id.");
  }

  const deadline = Date.now() + maxWaitMs;
  let nextToken: string | undefined;
  let delayMs = 1500;
  const lines: string[] = [];

  while (Date.now() < deadline) {
    const response = await getTextractClient().send(
      new GetDocumentTextDetectionCommand({
        JobId: startResponse.JobId,
        NextToken: nextToken,
      }),
    );

    const status = response.JobStatus;
    if (status === "FAILED") {
      throw new Error(response.StatusMessage || "Textract job failed.");
    }

    if (status === "SUCCEEDED" || status === "PARTIAL_SUCCESS") {
      const text = extractLines(response.Blocks);
      if (text) {
        lines.push(text);
      }
      if (response.NextToken) {
        nextToken = response.NextToken;
        continue;
      }
      return lines.join("\n");
    }

    await sleep(delayMs);
    delayMs = Math.min(delayMs * 1.4, 8000);
  }

  const seconds = Math.round(maxWaitMs / 1000);
  throw new Error(`Textract timed out after ${seconds} seconds.`);
};
