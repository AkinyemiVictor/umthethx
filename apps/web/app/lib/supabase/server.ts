import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env";

const baseOptions = {
  auth: {
    persistSession: false,
  },
};

export const getSupabaseAdminClient = (): SupabaseClient => {
  const url = env.get("SUPABASE_URL");
  const serviceRoleKey = env.get("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceRoleKey, baseOptions);
};
