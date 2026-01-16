import { getAuthUser, getSupabaseServerClient } from "../../src/lib/auth-server";

export type UserPlan = "free" | "pro";

const normalizePlan = (value?: string | null): UserPlan =>
  value === "pro" ? "pro" : "free";

export const PLAN_LIMITS: Record<UserPlan, { jobs: number; bytes: number }> = {
  free: { jobs: 20, bytes: 25 * 1024 * 1024 },
  pro: { jobs: 200, bytes: 200 * 1024 * 1024 },
};

export async function getUserPlan(userId?: string): Promise<UserPlan> {
  try {
    const resolvedUserId =
      userId ?? (await getAuthUser())?.id ?? null;
    if (!resolvedUserId) {
      return "free";
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", resolvedUserId)
      .maybeSingle();

    if (error) {
      return "free";
    }

    return normalizePlan(data?.plan);
  } catch {
    return "free";
  }
}
