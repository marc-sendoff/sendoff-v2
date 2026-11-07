/* GET /api/deals?origin=MIA — the real deal drops.
   A drop is a live fare at least 20% under what that route usually costs
   from this origin (the running average fare-alerts keeps in typical/<ORIGIN>,
   after at least 6 refreshes). Shape is what src/components/DealDrops.jsx
   already expects: { ok, origin, deals:[{ tripId, price, typical, month, n }] }.
   An empty list is a real answer: the strip says "no drops right now". */
import { getStore } from "@netlify/blobs";
import { readFileSync } from "node:fs";
import { json } from "../lib/tp.mjs";

const TRIPS = JSON.parse(readFileSync(new URL("../data/trips-snapshot.json", import.meta.url), "utf8"));
const MIN_N = 6, CUT = 0.8, MAX = 8;

export default async (req) => {
  const url = new URL(req.url);
  const origin = String(url.searchParams.get("origin") ?? "").toUpperCase();
  if (!/^[A-Z]{3}$/.test(origin)) return json({ ok: false, error: "origin must be a 3-letter code" }, 400);
  const store = getStore("fares");
  const [fares, typical] = await Promise.all([
    store.get(`fares/${origin}`, { type: "json" }).catch(() => null),
    store.get(`typical/${origin}`, { type: "json" }).catch(() => null),
  ]);
  const deals = [];
  if (fares?.fares && typical?.dests) {
    const seen = new Set();
    for (const t of TRIPS) {
      const dest = t.fly ? String(t.fly).toUpperCase() : null;
      if (!dest || dest === origin || seen.has(dest)) continue;
      const f = fares.fares[dest], d = typical.dests[dest];
      if (!f?.price || !d || d.n < MIN_N || f.price > d.typical * CUT) continue;
      seen.add(dest);
      deals.push({ tripId: t.id, price: f.price, typical: d.typical, month: f.month, n: d.n });
    }
    deals.sort((a, b) => a.price / a.typical - b.price / b.typical);
  }
  return json({ ok: true, origin, updatedAt: fares?.updatedAt ?? null, typicalAt: typical?.updatedAt ?? null, routesTracked: Object.keys(typical?.dests ?? {}).length, deals: deals.slice(0, MAX) }, 200, { "Cache-Control": "public, max-age=600" });
};

export const config = { path: "/api/deals" };
