export type EnvKey =
  | "SUPABASE_URL"
  | "SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "PUBLIC_USER_ID"
  | "AWS_REGION"
  | "AWS_ACCESS_KEY_ID"
  | "AWS_SECRET_ACCESS_KEY"
  | "S3_BUCKET"
  | "REDIS_URL";

const readEnv = (key: EnvKey) => process.env[key]?.trim();

export const env = {
  get(key: EnvKey) {
    const value = readEnv(key);
    if (!value) {
      throw new Error(`Missing required env: ${key}`);
    }
    return value;
  },
  optional(key: EnvKey) {
    return readEnv(key);
  },
};
