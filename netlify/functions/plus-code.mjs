/* POST /api/plus-code  { code }
   The Sendoff+ access code, checked server-side so the bundle never carries
   it. Set PLUS_ACCESS_CODE in the Netlify environment; until then this
   answers 503 and the modal says codes aren't working, which is honest.
   Wrong guesses are throttled per IP (in-memory, per function instance:
   good enough to stop a casual brute force, not a security boundary). */
import { json } from "../lib/tp.mjs";
import { userFromRequest, setMembership } from "../lib/auth.mjs";

const MAX_FAILS = 8;
const WINDOW_MS = 10 * 60 * 1000;
const fails = new Map(); // ip -> { n, resetAt }

const same = (a, b) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

export default async (req, context) => {
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  const secret = (process.env.PLUS_ACCESS_CODE ?? "").trim();
  if (!secret) return json({ ok: false, error: "not available yet" }, 503);
  const ip = context?.ip ?? req.headers.get("x-nf-client-connection-ip") ?? "?";
  const now = Date.now();
  const f = fails.get(ip);
  if (f && f.resetAt > now && f.n >= MAX_FAILS) return json({ ok: false, error: "too many attempts" }, 429);
  let code = "";
  try { code = String((await req.json())?.code ?? "").trim(); } catch { return json({ ok: false, error: "bad request" }, 400); }
  if (code && same(code.toLowerCase(), secret.toLowerCase())) {
    fails.delete(ip);
    /* Signed in: the code grants Plus on the account itself, so it follows
       them to every device. Signed out: just confirms the code (the old
       browser-only unlock) so nothing breaks before accounts roll out. */
    const user = await userFromRequest(req);
    if (user) {
      try {
        await setMembership(user.id, { plan: "plus", source: "code", interval: null, current_period_end: null, cancel_at_period_end: false });
      } catch (err) {
        console.error(`plus-code: could not save membership: ${err.message}`);
        return json({ ok: false, error: "could not save" }, 500);
      }
    }
    return json({ ok: true, saved: Boolean(user) });
  }
  fails.set(ip, f && f.resetAt > now ? { n: f.n + 1, resetAt: f.resetAt } : { n: 1, resetAt: now + WINDOW_MS });
  return json({ ok: false, error: "wrong code" }, 401);
};

export const config = { path: "/api/plus-code" };
