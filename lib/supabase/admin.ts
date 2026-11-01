import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseAdminConfigured = Boolean(
  supabaseUrl && serviceRoleKey,
);

export function createAdminClient() {
  if (!isSupabaseAdminConfigured) {
    throw new Error(
      "Booking storage is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
