export const DEVICE_ID_STORAGE_KEY = "umthethx-device-id";
export const DEVICE_ID_HEADER = "x-um-device-id";

const DEVICE_ID_PATTERN = /^[a-z0-9-]{8,128}$/i;

export const normalizeDeviceId = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  if (!trimmed || !DEVICE_ID_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed;
};

export const getOrCreateDeviceId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = normalizeDeviceId(
    window.localStorage.getItem(DEVICE_ID_STORAGE_KEY),
  );
  if (existing) {
    return existing;
  }

  const next =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, next);
  return next;
};
