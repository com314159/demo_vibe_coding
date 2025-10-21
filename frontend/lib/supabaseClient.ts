import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';

let browserClientSingleton:
  | ReturnType<typeof createBrowserSupabaseClient<Database>>
  | null = null;

export const getBrowserClient = () => {
  if (!browserClientSingleton) {
    browserClientSingleton = createBrowserSupabaseClient<Database>({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    });
  }
  return browserClientSingleton;
};
