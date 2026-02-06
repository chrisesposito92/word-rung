'use client';

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

let singletonClient: SupabaseClient<Database> | null = null;

export type AuthUser = Pick<User, 'id' | 'email'>;

export function createSupabaseBrowserClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!singletonClient) {
    singletonClient = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return singletonClient;
}
