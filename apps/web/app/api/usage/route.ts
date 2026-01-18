import { NextResponse } from "next/server";
import { getAuthUser, getSupabaseServerClient } from "../../../src/lib/auth-server";
import { PLAN_LIMITS, getUserPlan } from "../../lib/plans";

export const runtime = "nodejs";

const getPeriodStart = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return start.toISOString().slice(0, 10);
};

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const periodStart = getPeriodStart();
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("usage_counters")
    .select("bytes_used, jobs_used, period_start")
    .eq("user_id", user.id)
    .eq("period_start", periodStart)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const plan = await getUserPlan(user.id);

  return NextResponse.json({
    periodStart,
    plan,
    limits: PLAN_LIMITS[plan],
    bytesUsed: data?.bytes_used ?? 0,
    jobsUsed: data?.jobs_used ?? 0,
  });
}
