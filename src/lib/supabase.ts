import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_client) {
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase env vars manquantes");
    _client = createClient(supabaseUrl, supabaseKey);
  }
  return _client;
}

export const supabase = { from: (...args: Parameters<ReturnType<typeof createClient>["from"]>) => getSupabase().from(...args) };

export type DashboardClient = {
  id: string;
  slug: string;
  name: string;
  outputs: {
    brief_strategique?: boolean;
    platform?: boolean;
    campaign?: boolean;
    site?: boolean;
    wiki?: boolean;
  };
  progress: string | null;
  updated_at: string;
};

export type DashboardWiki = {
  id: string;
  client_slug: string;
  html_content: string | null;
  updated_at: string;
};
