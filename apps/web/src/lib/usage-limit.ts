import { getRedisConnection } from "./queue";
import { normalizeDeviceId, DEVICE_ID_HEADER } from "./device-id";

export type UsageScope = "converter" | "ai-notemaker";

type UsagePolicy = {
  label: string;
  limit: number;
  ipLimit: number;
  windowSeconds: number;
  byteLimit?: number;
  ipByteLimit?: number;
  byteWindowSeconds?: number;
};

type UsageCheckResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  message: string;
};

export type UsageStatusEntry = {
  used: number;
  limit: number;
  remaining: number;
  windowSeconds: number;
  retryAfterSeconds: number;
  blocked: boolean;
  subjectLabel: string;
};

export type UsageStatusSnapshot = {
  blocked: boolean;
  retryAfterSeconds: number;
  message: string;
  count: UsageStatusEntry;
  bytes?: UsageStatusEntry;
};

type UsageTrackedKey = {
  key: string;
  limit: number;
  subjectLabel: string;
};

type UsageCheckOptions = {
  bytes?: number;
  units?: number;
};

const DEFAULT_CONVERTER_LIMIT = 12;
const DEFAULT_CONVERTER_IP_LIMIT = 40;
const DEFAULT_CONVERTER_WINDOW_SECONDS = 4 * 60 * 60;
const DEFAULT_CONVERTER_BYTE_LIMIT = 100 * 1024 * 1024;
const DEFAULT_CONVERTER_IP_BYTE_LIMIT = 250 * 1024 * 1024;
const DEFAULT_CONVERTER_BYTE_WINDOW_SECONDS = 4 * 60 * 60;
const DEFAULT_AI_NOTEMAKER_LIMIT = 60;
const DEFAULT_AI_NOTEMAKER_IP_LIMIT = 120;
const DEFAULT_AI_NOTEMAKER_WINDOW_SECONDS = 24 * 60 * 60;

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

const usagePolicies: Record<UsageScope, UsagePolicy> = {
  converter: {
    label: "converter",
    limit: parsePositiveInteger(
      process.env.CONVERTER_USAGE_LIMIT?.trim(),
      DEFAULT_CONVERTER_LIMIT,
    ),
    ipLimit: parsePositiveInteger(
      process.env.CONVERTER_IP_USAGE_LIMIT?.trim(),
      DEFAULT_CONVERTER_IP_LIMIT,
    ),
    windowSeconds: parsePositiveInteger(
      process.env.CONVERTER_USAGE_WINDOW_SECONDS?.trim(),
      DEFAULT_CONVERTER_WINDOW_SECONDS,
    ),
    byteLimit: parsePositiveInteger(
      process.env.CONVERTER_USAGE_BYTES_LIMIT?.trim(),
      DEFAULT_CONVERTER_BYTE_LIMIT,
    ),
    ipByteLimit: parsePositiveInteger(
      process.env.CONVERTER_IP_USAGE_BYTES_LIMIT?.trim(),
      DEFAULT_CONVERTER_IP_BYTE_LIMIT,
    ),
    byteWindowSeconds: parsePositiveInteger(
      process.env.CONVERTER_USAGE_BYTES_WINDOW_SECONDS?.trim(),
      DEFAULT_CONVERTER_BYTE_WINDOW_SECONDS,
    ),
  },
  "ai-notemaker": {
    label: "NoteMaker",
    limit: parsePositiveInteger(
      process.env.AI_NOTEMAKER_USAGE_LIMIT?.trim(),
      DEFAULT_AI_NOTEMAKER_LIMIT,
    ),
    ipLimit: parsePositiveInteger(
      process.env.AI_NOTEMAKER_IP_USAGE_LIMIT?.trim(),
      DEFAULT_AI_NOTEMAKER_IP_LIMIT,
    ),
    windowSeconds: parsePositiveInteger(
      process.env.AI_NOTEMAKER_USAGE_WINDOW_SECONDS?.trim(),
      DEFAULT_AI_NOTEMAKER_WINDOW_SECONDS,
    ),
  },
};

let cachedRedis: ReturnType<typeof getRedisConnection> | null = null;

const getUsageRedis = () => {
  if (!cachedRedis) {
    cachedRedis = getRedisConnection();
  }
  return cachedRedis;
};

const readHeader = (request: Request, header: string) =>
  request.headers.get(header)?.trim() ?? "";

const getClientIp = (request: Request) => {
  const forwarded = readHeader(request, "x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  return (
    readHeader(request, "cf-connecting-ip") ||
    readHeader(request, "x-real-ip") ||
    null
  );
};

const normalizeIpForKey = (value: string | null) =>
  value ? value.replace(/[^a-z0-9:.\-]/gi, "-").slice(0, 80) : null;

const getCountLimitMessage = (
  policy: UsagePolicy,
) =>
  `Free ${policy.label} limit reached for now.`;

const getByteLimitMessage = (
  _entry: UsageTrackedKey,
  _policy: UsagePolicy,
  _retryAfterSeconds: number,
) =>
  "Free conversion limit reached for now.";

const getTrackedKeys = (request: Request, scope: UsageScope) => {
  const policy = usagePolicies[scope];
  const deviceId = normalizeDeviceId(readHeader(request, DEVICE_ID_HEADER));
  const ip = normalizeIpForKey(getClientIp(request));

  const keys: UsageTrackedKey[] = [];

  if (deviceId) {
    keys.push({
      key: `usage:${scope}:device:${deviceId}`,
      limit: policy.limit,
      subjectLabel: "device",
    });
  }

  if (ip) {
    keys.push({
      key: `usage:${scope}:ip:${ip}`,
      limit: policy.ipLimit,
      subjectLabel: "network",
    });
  }

  if (keys.length === 0) {
    keys.push({
      key: `usage:${scope}:anonymous`,
      limit: policy.limit,
      subjectLabel: "device",
    });
  }

  return { keys, policy };
};

const getByteTrackedKeys = (request: Request, scope: UsageScope) => {
  const policy = usagePolicies[scope];
  if (!policy.byteLimit || !policy.byteWindowSeconds) {
    return null;
  }

  const deviceId = normalizeDeviceId(readHeader(request, DEVICE_ID_HEADER));
  const ip = normalizeIpForKey(getClientIp(request));
  const keys: UsageTrackedKey[] = [];

  if (deviceId) {
    keys.push({
      key: `usage:${scope}:bytes:device:${deviceId}`,
      limit: policy.byteLimit,
      subjectLabel: "device",
    });
  }

  if (ip) {
    keys.push({
      key: `usage:${scope}:bytes:ip:${ip}`,
      limit: policy.ipByteLimit ?? policy.byteLimit,
      subjectLabel: "network",
    });
  }

  if (keys.length === 0) {
    keys.push({
      key: `usage:${scope}:bytes:anonymous`,
      limit: policy.byteLimit,
      subjectLabel: "device",
    });
  }

  return { keys, policy };
};

const getRetryAfter = async (key: string, windowSeconds: number) => {
  const redis = getUsageRedis();
  const ttl = await redis.ttl(key);
  return ttl > 0 ? ttl : windowSeconds;
};

const readUsageEntry = async (
  entry: UsageTrackedKey,
  windowSeconds: number,
): Promise<UsageStatusEntry> => {
  const redis = getUsageRedis();
  const raw = await redis.get(entry.key);
  const parsed = Number.parseInt(raw ?? "0", 10);
  const used = Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
  const retryAfterSeconds =
    used > 0 ? await getRetryAfter(entry.key, windowSeconds) : 0;

  return {
    used,
    limit: entry.limit,
    remaining: Math.max(entry.limit - used, 0),
    windowSeconds,
    retryAfterSeconds,
    blocked: used >= entry.limit,
    subjectLabel: entry.subjectLabel,
  };
};

export const getUsageStatus = async (
  request: Request,
  scope: UsageScope,
): Promise<UsageStatusSnapshot> => {
  const { keys, policy } = getTrackedKeys(request, scope);
  const primaryCountKey = keys[0];
  if (!primaryCountKey) {
    throw new Error("No usage tracking keys configured.");
  }
  const countEntries = await Promise.all(
    keys.map((entry) => readUsageEntry(entry, policy.windowSeconds)),
  );
  const displayCount =
    countEntries[0] ??
    ({
      used: 0,
      limit: primaryCountKey.limit,
      remaining: primaryCountKey.limit,
      windowSeconds: policy.windowSeconds,
      retryAfterSeconds: 0,
      blocked: false,
      subjectLabel: primaryCountKey.subjectLabel,
    } satisfies UsageStatusEntry);
  const blockingCountIndex = countEntries.findIndex((entry) => entry.blocked);

  const byteTracked = getByteTrackedKeys(request, scope);
  const byteEntries = byteTracked
    ? await Promise.all(
        byteTracked.keys.map((entry) =>
          readUsageEntry(
            entry,
            byteTracked.policy.byteWindowSeconds ??
              DEFAULT_CONVERTER_BYTE_WINDOW_SECONDS,
          ),
        ),
      )
    : [];
  const primaryByteKey = byteTracked?.keys[0];
  const displayBytes =
    byteEntries[0] ??
    (primaryByteKey && byteTracked
      ? ({
          used: 0,
          limit: primaryByteKey.limit,
          remaining: primaryByteKey.limit,
          windowSeconds:
            byteTracked.policy.byteWindowSeconds ??
            DEFAULT_CONVERTER_BYTE_WINDOW_SECONDS,
          retryAfterSeconds: 0,
          blocked: false,
          subjectLabel: primaryByteKey.subjectLabel,
        } satisfies UsageStatusEntry)
      : undefined);
  const blockingBytesIndex = byteEntries.findIndex((entry) => entry.blocked);

  let message = "";
  let retryAfterSeconds = 0;
  if (blockingCountIndex >= 0) {
    retryAfterSeconds =
      countEntries[blockingCountIndex]?.retryAfterSeconds ??
      policy.windowSeconds;
    message = getCountLimitMessage(policy);
  } else if (blockingBytesIndex >= 0 && byteTracked) {
    retryAfterSeconds =
      byteEntries[blockingBytesIndex]?.retryAfterSeconds ??
      byteTracked.policy.byteWindowSeconds ??
      DEFAULT_CONVERTER_BYTE_WINDOW_SECONDS;
    message = getByteLimitMessage(
      byteTracked.keys[blockingBytesIndex] ?? primaryByteKey ?? primaryCountKey,
      byteTracked.policy,
      retryAfterSeconds,
    );
  }

  return {
    blocked: blockingCountIndex >= 0 || blockingBytesIndex >= 0,
    retryAfterSeconds,
    message,
    count: displayCount,
    ...(displayBytes ? { bytes: displayBytes } : {}),
  };
};

export const peekUsageLimit = async (
  request: Request,
  scope: UsageScope,
  options: UsageCheckOptions = {},
): Promise<UsageCheckResult> => {
  const redis = getUsageRedis();
  const { keys, policy } = getTrackedKeys(request, scope);
  const requestedUnits =
    Number.isFinite(options.units) && (options.units ?? 0) > 0
      ? Math.floor(options.units ?? 1)
      : 1;

  for (const entry of keys) {
    const raw = await redis.get(entry.key);
    const count = Number.parseInt(raw ?? "0", 10);
    if (
      Number.isInteger(count) &&
      count + requestedUnits > entry.limit
    ) {
      const retryAfterSeconds = await getRetryAfter(entry.key, policy.windowSeconds);
      return {
        allowed: false,
        retryAfterSeconds,
        message: getCountLimitMessage(policy),
      };
    }
  }

  if (scope === "converter" && options.bytes && options.bytes > 0) {
    const byteTracked = getByteTrackedKeys(request, scope);
    if (byteTracked) {
      for (const entry of byteTracked.keys) {
        const raw = await redis.get(entry.key);
        const usedBytes = Number.parseInt(raw ?? "0", 10);
        if (
          Number.isInteger(usedBytes) &&
          usedBytes + options.bytes > entry.limit
        ) {
          const retryAfterSeconds = await getRetryAfter(
            entry.key,
            byteTracked.policy.byteWindowSeconds ??
              DEFAULT_CONVERTER_BYTE_WINDOW_SECONDS,
          );
          return {
            allowed: false,
            retryAfterSeconds,
            message: getByteLimitMessage(
              entry,
              byteTracked.policy,
              retryAfterSeconds,
            ),
          };
        }
      }
    }
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    message: "",
  };
};

export const consumeUsageLimit = async (
  request: Request,
  scope: UsageScope,
  options: UsageCheckOptions = {},
): Promise<UsageCheckResult> => {
  const redis = getUsageRedis();
  const { keys, policy } = getTrackedKeys(request, scope);
  const requestedUnits =
    Number.isFinite(options.units) && (options.units ?? 0) > 0
      ? Math.floor(options.units ?? 1)
      : 1;

  for (const entry of keys) {
    const count = await redis.incrby(entry.key, requestedUnits);
    let ttl = await redis.ttl(entry.key);
    if (count === requestedUnits || ttl < 0) {
      await redis.expire(entry.key, policy.windowSeconds);
      ttl = policy.windowSeconds;
    }

    if (count > entry.limit) {
      return {
        allowed: false,
        retryAfterSeconds: ttl > 0 ? ttl : policy.windowSeconds,
        message: getCountLimitMessage(policy),
      };
    }
  }

  if (scope === "converter" && options.bytes && options.bytes > 0) {
    const byteTracked = getByteTrackedKeys(request, scope);
    if (byteTracked) {
      const incrementedByteKeys: string[] = [];
      for (const entry of byteTracked.keys) {
        const nextBytes = await redis.incrby(entry.key, options.bytes);
        incrementedByteKeys.push(entry.key);
        let ttl = await redis.ttl(entry.key);
        if (nextBytes === options.bytes || ttl < 0) {
          await redis.expire(
            entry.key,
            byteTracked.policy.byteWindowSeconds ??
              DEFAULT_CONVERTER_BYTE_WINDOW_SECONDS,
          );
          ttl =
            byteTracked.policy.byteWindowSeconds ??
            DEFAULT_CONVERTER_BYTE_WINDOW_SECONDS;
        }

        if (nextBytes > entry.limit) {
          for (const countEntry of keys) {
            await redis
              .decrby(countEntry.key, requestedUnits)
              .catch(() => undefined);
          }
          for (const byteKey of incrementedByteKeys) {
            await redis.decrby(byteKey, options.bytes).catch(() => undefined);
          }

          return {
            allowed: false,
            retryAfterSeconds:
              ttl > 0
                ? ttl
                : byteTracked.policy.byteWindowSeconds ??
                  DEFAULT_CONVERTER_BYTE_WINDOW_SECONDS,
            message: getByteLimitMessage(
              entry,
              byteTracked.policy,
              ttl > 0
                ? ttl
                : byteTracked.policy.byteWindowSeconds ??
                  DEFAULT_CONVERTER_BYTE_WINDOW_SECONDS,
            ),
          };
        }
      }
    }
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    message: "",
  };
};
