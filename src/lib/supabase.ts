import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/schema";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient<Database> | null = null;

export function getClient(): SupabaseClient<Database> {
  if (!_client) {
    if (!url || !anonKey) {
      _client = {
        from: () => ({ select: () => ({ eq: () => ({}) }) } as never),
        auth: { getSession: async () => ({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
                signInWithOAuth: async () => ({ data: null, error: new Error("offline") }),
                signOut: async () => ({ error: null }) },
      } as unknown as SupabaseClient<Database>;
    } else {
      _client = createClient<Database>(url, anonKey, {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
      });
    }
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return (getClient() as never)[prop as string];
  },
});
