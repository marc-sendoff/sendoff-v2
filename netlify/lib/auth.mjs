/* Server-side Supabase: a client with the secret key (bypasses RLS, so it
   is the only thing allowed to write memberships) and a helper that turns a
   request's bearer token into the signed-in user. The project URL is public
   and baked in; the secret key comes from the Netlify environment. */
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.SUPABASE_URL || "https://ghekylqfodslbipoayrl.supabase.co";

export function admin() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set in the Netlify environment");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/* The user behind a request, or null. Never throws on a bad token. */
export async function userFromRequest(req) {
  const h = req.headers.get("authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token) return null;
  try {
    const { data, error } = await admin().auth.getUser(token);
    return error ? null : data.user;
  } catch {
    return null;
  }
}

/* Write the membership row for a user. Only ever called from functions. */
export async function setMembership(userId, fields) {
  const { error } = await admin().from("memberships")
    .upsert({ user_id: userId, ...fields, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/* Founders Club: the first FOUNDER_SEATS people to pay for a YEAR become
   Founders automatically, numbered in order. Once a seat is taken it stays
   with that account even if they later cancel (the badge is for being early,
   not for staying), so the count never frees up. Everyone after seat 10 is a
   regular Plus member. */
export const FOUNDER_SEATS = Number(process.env.FOUNDER_SEATS) || 10;
export async function claimFounderSeat(userId) {
  const db = admin();
  const { data: mine } = await db.from("memberships").select("founder_number").eq("user_id", userId).maybeSingle();
  if (mine?.founder_number) return mine.founder_number;
  const { data: taken } = await db.from("memberships").select("founder_number").not("founder_number", "is", null);
  const used = new Set((taken ?? []).map((r) => r.founder_number));
  for (let n = 1; n <= FOUNDER_SEATS; n++) if (!used.has(n)) return n;
  return null; // sold out
}
