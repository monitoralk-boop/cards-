/**
 * Supabase configuration and client helper
 *
 * For database queries, Drizzle ORM connects directly to Supabase PostgreSQL
 * via process.env.DATABASE_URL.
 *
 * For authentication and realtime events, the Supabase client can be configured
 * with SUPABASE_URL and SUPABASE_ANON_KEY.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  databaseUrl?: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL || "https://your-project.supabase.co";
  const anonKey = process.env.SUPABASE_ANON_KEY || "your-anon-key";
  const databaseUrl = process.env.DATABASE_URL;

  return {
    url,
    anonKey,
    databaseUrl,
  };
}

export const isSupabaseConfigured = (): boolean => {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
};
