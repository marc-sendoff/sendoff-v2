/* GET /api/founders — how many Founders seats are gone and who holds them
   (first name + city only; the rest of the profile stays private). Public,
   cached a minute, so the Plus modal can say "7 of 10 seats left". */
import { admin, FOUNDER_SEATS } from "../lib/auth.mjs";
import { json } from "../lib/tp.mjs";

export default async () => {
  let rows = [];
  try {
    const db = admin();
    const { data: mem } = await db.from("memberships").select("user_id, founder_number").not("founder_number", "is", null).order("founder_number");
    const ids = (mem ?? []).map((m) => m.user_id);
    const { data: profiles } = ids.length ? await db.from("profiles").select("id, name, city").in("id", ids) : { data: [] };
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    rows = (mem ?? []).map((m) => {
      const p = byId.get(m.user_id) || {};
      return { number: m.founder_number, name: String(p.name || "").trim().split(/\s+/)[0] || "Founder", city: p.city || null };
    });
  } catch (err) {
    console.error(`founders: ${err.message}`);
  }
  return json({ ok: true, seats: FOUNDER_SEATS, taken: rows.length, left: Math.max(0, FOUNDER_SEATS - rows.length), founders: rows },
    200, { "Cache-Control": "public, max-age=60" });
};

export const config = { path: "/api/founders" };
