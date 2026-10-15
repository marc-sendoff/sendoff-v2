/* The fare refresh. Runs every 15 minutes and refreshes ONE origin per run,
   rotating through the first ORIGINS_N metros in netlify/data/origins.json
   (Florida first, then the big US cities), so the whole set turns over every
   few hours and no single run comes near the function timeout.

   Per origin: two "sweep" calls per month (origin + unique=true returns the
   cheapest fare to many destinations at once), then pairwise backfill for the
   destinations the sweep missed, until the time budget is spent. The result
   is merged over the previous pull so a thin night never blanks a city, and
   written to Netlify Blobs as fares/<ORIGIN>. /api/cheapest ranks from it.

   Ported from gate/scripts/pull-cheapest.mjs on the old box, minus the
   history/"typical" tracking, which nothing on the site reads yet. */
import { getStore } from "@netlify/blobs";
import { readFileSync } from "node:fs";
import { tpRows, monthsAhead, MAX_FARE } from "../lib/tp.mjs";

const ORIGINS = JSON.parse(readFileSync(new URL("../data/origins.json", import.meta.url), "utf8"));
const TRIPS = JSON.parse(readFileSync(new URL("../data/trips-snapshot.json", import.meta.url), "utf8"));
const WANTED = [...new Set(TRIPS.filter((t) => t.fly).map((t) => String(t.fly).toUpperCase()))].sort();
const WANTED_SET = new Set(WANTED);

const ORIGINS_N = Math.max(1, Number(process.env.FARES_ORIGINS_N) || 12);
const MONTHS = 2;
const BUDGET_MS = 7500;   // the function has 10s; leave room to write
const KEEP_MS = 7 * 24 * 60 * 60 * 1000; // a fare not re-seen in a week drops out

function absorb(fares, rows, month, seenAt) {
  let added = 0;
  for (const r of rows ?? []) {
    const dest = String(r?.destination ?? "").toUpperCase();
    const price = Number(r?.price ?? r?.value);
    if (!/^[A-Z]{3}$/.test(dest) || !Number.isFinite(price) || price < 1 || price > MAX_FARE) continue;
    if (!WANTED_SET.has(dest)) continue;
    const prev = fares[dest];
    const fresh = prev && prev.seenAt === seenAt;
    if (!fresh || price < prev.price) {
      fares[dest] = {
        price: Math.round(price),
        month: String(r.departure_at ?? month).slice(0, 7),
        ...(r.transfers !== undefined ? { transfers: Number(r.transfers) } : {}),
        seenAt,
      };
      added++;
    }
  }
  return added;
}

export async function pullOrigin(origin, store, { budgetMs = BUDGET_MS } = {}) {
  const started = Date.now();
  const seenAt = new Date(started).toISOString();
  const prev = (await store.get(`fares/${origin}`, { type: "json" }).catch(() => null)) ?? {};
  const fares = {};
  for (const [dest, f] of Object.entries(prev.fares ?? {})) {
    const age = started - Date.parse(f?.seenAt ?? prev.updatedAt ?? 0);
    if (Number.isFinite(age) && age < KEEP_MS) fares[dest] = f;
  }
  const base = { origin, market: "us" };
  let calls = 0;
  for (const month of monthsAhead(MONTHS)) {
    calls++;
    absorb(fares, await tpRows({ ...base, departure_at: month, unique: "true", sorting: "route", limit: "1000" }), month, seenAt);
    if (Date.now() - started > budgetMs) break;
    calls++;
    absorb(fares, await tpRows({ ...base, departure_at: month, sorting: "price", limit: "1000" }), month, seenAt);
    if (Date.now() - started > budgetMs) break;
  }
  // backfill: oldest-or-missing destinations first, as many as the budget allows
  const stale = WANTED.filter((d) => d !== origin)
    .map((d) => [d, fares[d]?.seenAt === seenAt ? 1 : 0])
    .filter(([, fresh]) => !fresh).map(([d]) => d);
  let backfilled = 0;
  for (const dest of stale) {
    if (Date.now() - started > budgetMs) break;
    calls++;
    absorb(fares, await tpRows({ ...base, destination: dest, departure_at: monthsAhead(1)[0], limit: "30" }), monthsAhead(1)[0], seenAt);
    backfilled++;
  }
  const doc = {
    origin,
    updatedAt: seenAt,
    source: "travelpayouts/aviasales v3 prices_for_dates (cached, indicative)",
    destinations: Object.keys(fares).length,
    market: "us",
    fareKind: "rt",
    fares,
  };
  if (doc.destinations === 0) {
    console.error(`${origin}: 0 destinations priced, keeping the previous blob`);
    return { origin, calls, backfilled, priced: 0, kept: true };
  }
  await store.setJSON(`fares/${origin}`, doc);
  return { origin, calls, backfilled, priced: doc.destinations, ms: Date.now() - started };
}

/* Display-only exchange rates, one free call, refreshed each time the
   rotation wraps around. Every stored fare stays USD. */
async function pullRates(store) {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error(`http ${res.status}`);
    const body = await res.json();
    if (body?.result !== "success" || !(Number(body.rates?.EUR) > 0)) throw new Error("unexpected payload");
    await store.setJSON("rates", { base: "USD", updatedAt: new Date().toISOString(), source: "open.er-api.com", rates: body.rates });
  } catch (err) {
    console.error(`rates: ${err.message}, keeping the previous blob`);
  }
}

export default async (req) => {
  const store = getStore("fares");
  const list = ORIGINS.slice(0, ORIGINS_N).map((o) => o.code);
  const url = new URL(req.url);
  const forced = url.searchParams.get("origin")?.toUpperCase();
  let origin = forced && /^[A-Z]{3}$/.test(forced) ? forced : null;
  if (!origin) {
    const cursor = Number((await store.get("cursor").catch(() => null)) ?? 0) || 0;
    origin = list[cursor % list.length];
    await store.set("cursor", String((cursor + 1) % list.length));
    if (cursor % list.length === 0) await pullRates(store);
  }
  const result = await pullOrigin(origin, store);
  console.log(JSON.stringify(result));
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
};

export const config = { schedule: "*/15 * * * *" };
