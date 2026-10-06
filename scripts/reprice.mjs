/* Reprice the catalog from genuine data:
     node scripts/reprice.mjs <benchDir> <liveCheapestJson>
   Inputs: bench-*.json benchmark tables (researched hostel/food/fun per day
   + budget RT fares from MIA where the live feed has no coverage) and the
   live /api/cheapest payload (real fares). Output: src/data/pricing.json
   (id -> { cost, breakdown, source }) consumed by trips.js at load, plus an
   audit table on stdout. Deterministic — re-run when benchmarks refresh.

   Model (per person, USD):
     nights = days - 1 (min 1)
     travel = live fare × 1.10 (seasonality pad, round $5)
            | benchmark fareRT (already a conservative achievable-low)
            | driveOnly: keep the trip's current travel share (gas-scale)
     stay   = nights × hostelNight     food = days × foodDay
     fun    = days × funDay            cost = round5(sum)                 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const [benchDir, livePath] = process.argv.slice(2);
if (!benchDir || !livePath) { console.error("usage: node scripts/reprice.mjs <benchDir> <liveCheapestJson>"); process.exit(1); }

const tripsSrc = readFileSync(join(here, "../src/data/trips.js"), "utf8");
const start = tripsSrc.indexOf("export const TRIPS");
const TRIPS = eval("(" + tripsSrc.slice(tripsSrc.indexOf("[", start), tripsSrc.indexOf("];", start) + 1) + ")");

const bench = {};
for (const f of readdirSync(benchDir).filter((f) => f.startsWith("bench-") && f.endsWith(".json"))) {
  for (const row of JSON.parse(readFileSync(join(benchDir, f), "utf8"))) bench[row.id] = row;
}
const live = JSON.parse(readFileSync(livePath, "utf8"));
const liveFare = Object.fromEntries(live.results.map((r) => [r.tripId, r.farePerPerson]));

const round5 = (n) => Math.round(n / 5) * 5;

/* Costs the per-day model can't see (researcher-flagged, per person):
   mandatory fees and boat legs that are the price of admission, not a
   daily. Applied on top of the base calc. */
const ADJUST = {
  galapagos: { fun: 220, why: "Galápagos National Park entry fee" },
  dryTortugas: { travel: 220, why: "Yankee Freedom ferry RT — the only way out" },
  channelislands: { travel: 65, why: "Island Packers ferry RT" },
};

const pricing = {};
const audit = [];
let missing = [];

for (const t of TRIPS) {
  const b = bench[t.id];
  if (!b) { missing.push(t.id); continue; }
  const nights = Math.max(1, t.days - 1);
  let travel, fareSource;
  if (t.driveOnly || !t.fly) {
    travel = round5(t.cost * 0.15); fareSource = "drive";
  } else if (liveFare[t.id] != null) {
    travel = round5(liveFare[t.id] * 1.10); fareSource = "live";
  } else if (Number.isFinite(b.fareRT)) {
    travel = round5(b.fareRT); fareSource = "bench";
  } else {
    travel = round5(t.cost * 0.45); fareSource = "ratio-fallback";
  }
  const stay = round5(nights * b.hostelNight);
  const food = round5(t.days * b.foodDay);
  let fun = round5(t.days * b.funDay);
  const adj = ADJUST[t.id];
  if (adj) { travel += adj.travel || 0; fun += adj.fun || 0; }
  const cost = round5(travel + stay + food + fun);
  pricing[t.id] = { cost, breakdown: { travel, stay, food, fun }, source: `${fareSource}|${b.confidence}` };
  audit.push({ id: t.id, old: t.cost, cost, delta: cost - t.cost, travel, stay, food, fun, fareSource, conf: b.confidence });
}

audit.sort((a, b) => a.delta - b.delta);
const pad = (v, n) => String(v).padEnd(n);
console.log(pad("id", 18) + pad("old", 6) + pad("new", 6) + pad("Δ", 7) + pad("fare", 6) + pad("stay", 6) + pad("food", 6) + pad("fun", 5) + pad("src", 16) + "conf");
for (const a of audit) console.log(pad(a.id, 18) + pad(a.old, 6) + pad(a.cost, 6) + pad((a.delta > 0 ? "+" : "") + a.delta, 7) + pad(a.travel, 6) + pad(a.stay, 6) + pad(a.food, 6) + pad(a.fun, 5) + pad(a.fareSource, 16) + a.conf);
const down = audit.filter((a) => a.delta < 0), up = audit.filter((a) => a.delta > 0);
console.log(`\n${audit.length} repriced: ${down.length} down (avg ${Math.round(down.reduce((s, a) => s + a.delta, 0) / (down.length || 1))}), ${up.length} up (avg +${Math.round(up.reduce((s, a) => s + a.delta, 0) / (up.length || 1))})`);
if (missing.length) console.log("MISSING benchmarks:", missing.join(", "));

writeFileSync(join(here, "../src/data/pricing.json"), JSON.stringify(pricing, null, 1) + "\n");
console.log(`\nwrote src/data/pricing.json (${Object.keys(pricing).length} trips)`);
