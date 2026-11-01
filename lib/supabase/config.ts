export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getSupabaseConfig() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Copy .env.local.example to .env.local and add your project credentials.",
    );
  }

  return {
    url: supabaseUrl,
    key: supabaseAnonKey,
  };
}
