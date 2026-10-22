/* The account layer. One hook, useAccount(), is the only thing App.jsx needs:
   who is signed in, their profile, their membership, their trips, and the
   actions that change them. Everything is read straight from Supabase under
   Row Level Security; membership is read-only here and written by the
   Netlify functions (checkout webhook, access code), never by the browser.

   Signed out: user is null and every list is empty. The app keeps its old
   browser-only behaviour for visitors (free tier, nothing saved). */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase.js";

const EMPTY = { profile: null, membership: null, trips: [] };

export function useAccount() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!supabase);
  const [data, setData] = useState(EMPTY);

  useEffect(() => {
    if (!supabase) return;
    let on = true;
    supabase.auth.getSession().then(({ data: { session: s } }) => { if (on) { setSession(s); setReady(true); } });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => { if (on) setSession(s); });
    return () => { on = false; sub.subscription.unsubscribe(); };
  }, []);

  const user = session?.user ?? null;

  const refresh = useCallback(async () => {
    if (!supabase || !user) { setData(EMPTY); return; }
    const [p, mem, t] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("memberships").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_trips").select("*").eq("user_id", user.id),
    ]);
    setData({ profile: p.data ?? null, membership: mem.data ?? null, trips: t.data ?? [] });
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  /* Plus/Founder, and not lapsed. A null period end means it never expires
     (access code, comp). */
  const isMember = useMemo(() => {
    const m = data.membership;
    if (!m || m.plan === "free") return false;
    if (!m.current_period_end) return true;
    return Date.parse(m.current_period_end) > Date.now();
  }, [data.membership]);

  const signIn = useCallback(async (email, name = "", city = "") => {
    if (!supabase) throw new Error("Accounts aren't switched on yet.");
    /* Send the link back to the exact page they started on — including the
       query string. Before launch that's /?launch=1 or /preview; dropping the
       query landed people on the signup page, which can't finish a sign-in,
       so the link looked "expired". */
    const redirect = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const data = {};
    if (name.trim()) data.name = name.trim();
    if (city.trim()) data.city = city.trim();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirect, data: Object.keys(data).length ? data : undefined },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setData(EMPTY);
  }, []);

  const saveProfile = useCallback(async (patch) => {
    if (!supabase || !user) return;
    const next = { ...patch, updated_at: new Date().toISOString() };
    const { data: row } = await supabase.from("profiles").update(next).eq("id", user.id).select().maybeSingle();
    if (row) setData((d) => ({ ...d, profile: row }));
  }, [user?.id]);

  const setTrip = useCallback(async (tripId, status, extra = {}) => {
    if (!supabase || !user) return;
    const row = { user_id: user.id, trip_id: tripId, status, ...extra };
    if (status === "done" && !row.done_at) row.done_at = new Date().toISOString().slice(0, 10);
    const { data: saved } = await supabase.from("user_trips").upsert(row).select().maybeSingle();
    if (saved) setData((d) => ({ ...d, trips: [...d.trips.filter((t) => t.trip_id !== tripId), saved] }));
  }, [user?.id]);

  const removeTrip = useCallback(async (tripId) => {
    if (!supabase || !user) return;
    await supabase.from("user_trips").delete().eq("user_id", user.id).eq("trip_id", tripId);
    setData((d) => ({ ...d, trips: d.trips.filter((t) => t.trip_id !== tripId) }));
  }, [user?.id]);

  /* Bearer token for the Netlify functions that act on behalf of this user. */
  const authHeaders = useCallback(() => (session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` } : {}), [session?.access_token]);

  const done = useMemo(() => data.trips.filter((t) => t.status === "done"), [data.trips]);
  const saved = useMemo(() => data.trips.filter((t) => t.status === "saved"), [data.trips]);
  const spent = useMemo(() => done.reduce((s, t) => s + (Number(t.spent) || 0), 0), [done]);

  return {
    enabled: Boolean(supabase), ready, user, session,
    profile: data.profile, membership: data.membership, isMember,
    trips: data.trips, done, saved, spent,
    signIn, signOut, saveProfile, setTrip, removeTrip, refresh, authHeaders,
  };
}

/* "Sender since 2025" — the year the account was made. */
export const senderSince = (profile, user) => {
  const iso = profile?.created_at || user?.created_at;
  return iso ? new Date(iso).getFullYear() : new Date().getFullYear();
};
