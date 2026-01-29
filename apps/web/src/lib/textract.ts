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

const extractLines = (blocks?: Block[]) =>
  (blocks ?? [])
    .filter((block) => block.BlockType === "LINE" && block.Text)
    .map((block) => block.Text?.trim())
    .filter(Boolean)
    .join("\n");

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
