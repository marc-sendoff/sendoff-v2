/* One Supabase client for the browser. The URL and publishable key are
   public (see .env.production); what keeps data private is Row Level
   Security on the tables (supabase/schema.sql). If the env is missing, for
   example on a machine without .env.production, `supabase` is null and every
   caller treats the visitor as logged out. */
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = url && key
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

export const AUTH_READY = Boolean(supabase);
