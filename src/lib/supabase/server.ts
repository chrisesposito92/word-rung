import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

function readSupabaseServerEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url,
    serviceRoleKey,
    anonKey,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, serviceRoleKey, anonKey } = readSupabaseServerEnv();
  return Boolean(url && anonKey && serviceRoleKey);
}

export function createSupabaseServiceClient(): SupabaseClient<Database> | null {
  const { url, serviceRoleKey } = readSupabaseServerEnv();
  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
