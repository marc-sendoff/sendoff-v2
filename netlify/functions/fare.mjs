/* GET /api/fare?origin=MIA&dest=BNA&out=2026-12-20&back=2026-12-23
   The fare for one route on chosen dates, straight from Travelpayouts' cached
   search prices: exact dates first, else the cheapest round trip that month
   with its own dates. Says which it is. Never invents a number. */
import { tpRows, cheapestRow, json } from "../lib/tp.mjs";

const IATA = /^[A-Z]{3}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export default async (req) => {
  const q = new URL(req.url).searchParams;
  const origin = String(q.get("origin") ?? "").toUpperCase();
  const dest = String(q.get("dest") ?? "").toUpperCase();
  const out = String(q.get("out") ?? "");
  const back = String(q.get("back") ?? "");
  if (!IATA.test(origin) || !IATA.test(dest) || !DAY.test(out) || !DAY.test(back)) {
    return json({ ok: false, error: "origin, dest (IATA) and out, back (YYYY-MM-DD) are required" }, 400);
  }
  let best = cheapestRow(await tpRows({ origin, destination: dest, departure_at: out, return_at: back }), dest);
  let exact = Boolean(best);
  if (!best) {
    best = cheapestRow(await tpRows({ origin, destination: dest, departure_at: out.slice(0, 7) }), dest);
    exact = false;
  }
  if (!best) return json({ ok: false, error: "no cached fare for this route" }, 404);
  const r = best.row;
  const day = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);
  return json({
    ok: true, origin, dest, price: best.price, currency: "USD", exact,
    out: exact ? out : day(r.departure_at), back: exact ? back : day(r.return_at),
    ...(r.transfers !== undefined ? { transfers: Number(r.transfers) } : {}),
    source: "travelpayouts cached search prices, round trip, per person (indicative, not a quote)",
  }, 200, { "Cache-Control": "public, max-age=3600" });
};

export const config = { path: "/api/fare" };
