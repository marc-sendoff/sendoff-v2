/* Client for /api/send: plan a send, read it, RSVP, chat. Friends keep a
   per-send token in localStorage so they never need an account. */
import { supabase } from "./supabase.js";

const tokenKey = (code) => `send:${code}`;
export const getToken = (code) => { try { return localStorage.getItem(tokenKey(code)) || ""; } catch { return ""; } };
export const setToken = (code, t) => { try { if (t) localStorage.setItem(tokenKey(code), t); } catch {} };

async function authHeaders() {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const jwt = data?.session?.access_token;
  return jwt ? { Authorization: `Bearer ${jwt}` } : {};
}

export async function loadSend(code) {
  const token = getToken(code);
  const r = await fetch(`/api/send?code=${encodeURIComponent(code)}${token ? `&token=${encodeURIComponent(token)}` : ""}`, { headers: await authHeaders() });
  const d = await r.json();
  if (d.ok && d.token) setToken(code, d.token);
  return d;
}

export async function mySends() {
  const r = await fetch("/api/send?mine=1", { headers: await authHeaders() });
  return r.json();
}

async function post(body) {
  const r = await fetch("/api/send", { method: "POST", headers: { "content-type": "application/json", ...(await authHeaders()) }, body: JSON.stringify(body) });
  return r.json();
}

export async function createSend(fields) {
  const d = await post({ action: "create", ...fields });
  if (d.ok) setToken(d.code, d.token);
  return d;
}
export async function rsvp(code, { name, contact, status }) {
  const d = await post({ action: "rsvp", code, name, contact, status, token: getToken(code) });
  if (d.ok) setToken(code, d.token);
  return d;
}
export const sendMessage = (code, body) => post({ action: "message", code, body, token: getToken(code) });
export const nudge = (code, member_id) => post({ action: "nudge", code, member_id, token: getToken(code) });
export const deleteSend = (code) => post({ action: "delete", code, token: getToken(code) });

export const sendUrl = (code) => `${window.location.origin}/s/${code}`;

export function fmtRange(a, b) {
  const f = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (!a) return "Dates TBC";
  return b ? `${f(a)} → ${f(b)}` : f(a);
}
