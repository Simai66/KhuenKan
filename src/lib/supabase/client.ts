import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";
export function createClient() {
  const { url, key } = publicEnv();
  return createBrowserClient<Database>(url, key);
}
