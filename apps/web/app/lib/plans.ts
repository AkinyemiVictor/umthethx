export type UserPlan = "free" | "pro";

export async function getUserPlan(_userId?: string): Promise<UserPlan> {
  return "free";
}
