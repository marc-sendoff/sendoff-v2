#!/usr/bin/env node
// Dumps the trip snapshot the gate service works from: the fields the crew
// digest matcher needs (id, name, tag, cost-per-person, days, vibes) plus the
// fields the cheapest-total ranker needs (fly, ground, driveOnly), from
// src/data/trips.js to gate/data/trips-snapshot.json — so the service never
// imports the app bundle.
//
// Regenerate after any catalog change:  npm run export:trips
// (also runs automatically as `prebuild` before `npm run build`)
//
// The output is COMMITTED — the gate container image copies gate/data/ and
// the scripts read it relative to their own file, never from the runtime
// DATA_DIR volume (/data), which holds mutable signup state.
//
// ON `cost` vs `ground` — read this before using either number:
//   `cost` is the curated ALL-IN per-person budget for the trip. It already
//   includes getting there. trips.js then splits it into a
//   travel/stay/food/fun breakdown using FIXED RATIOS (45/25/18/12 for flying
//   trips, 15/35/30/20 for drive-only) — that split is mechanical, not
//   curated per trip.
//   So `ground` here = cost - breakdown.travel = "what the trip costs once
//   you're there". The cheapest-total ranker adds a LIVE fare to `ground`,
//   never to `cost`, because adding a fare to `cost` would double-count the
//   travel the curated number already carries.
//   Treat `ground` as a good-faith estimate derived from a ratio, not as a
//   researched on-the-ground budget. If per-trip ground budgets are ever
//   curated for real, set `breakdown` explicitly in trips.js and this export
//   picks them up unchanged.
import { mkdirSync, writeFileSync } from "node:fs";
import { TRIPS } from "../src/data/trips.js";
import { AIRPORTS, WORLD_CITIES } from "../src/data/cities.js";

const snapshot = TRIPS.map(({ id, name, tag, cost, days, vibes, fly, driveOnly, breakdown }) => ({
  id, name, tag, cost, days, vibes,
  ...(fly ? { fly } : {}),
  ...(driveOnly ? { driveOnly: true } : {}),
  // ground = all-in minus the travel share (see the note above)
  ground: Math.max(0, cost - (breakdown?.travel ?? 0)),
  // stay = the lodging share inside ground; the ranker rescales it per crew
  ...(breakdown?.stay > 0 ? { stay: breakdown.stay } : {}),
}));

const bad = snapshot.filter((t) => !t.id || !Number.isFinite(t.cost) || t.cost <= 0
  || !Number.isFinite(t.ground) || t.ground <= 0);
if (bad.length) {
  console.error(`refusing to export: ${bad.length} trips with missing id or non-positive cost/ground`, bad.slice(0, 3));
  process.exit(1);
}
const flyable = snapshot.filter((t) => t.fly).length;

// Origins the app can actually ask about. The app sends AIRPORTS[city], which
// is a METRO code for multi-airport cities (New York -> NYC, Chicago -> CHI,
// Washington -> WAS), NOT an airport code. The nightly puller defaults to the
// first entries here, so its origins can never drift from what the app sends
// - a mismatch silently yields zero rows for that city.
// World origins carry their country so the puller can pick the right fare
// market per origin; US entries (the curated list) come first, so the
// puller's "first N" default stays the Florida-first US set.
const world = new Map(WORLD_CITIES.map((w) => [w.code, w]));
const seen = new Set();
const origins = [];
for (const [city, code] of Object.entries(AIRPORTS)) {
  if (!/^[A-Z]{3}$/.test(code) || seen.has(code)) continue; // some cities share a code
  seen.add(code);
  const w = world.get(code);
  origins.push(w ? { code, city, country: w.country, intl: true } : { code, city, country: "US" });
}
if (origins.length < 50) {
  console.error(`refusing to export: only ${origins.length} origin codes found in AIRPORTS`);
  process.exit(1);
}

mkdirSync("gate/data", { recursive: true });
writeFileSync("gate/data/origins.json", JSON.stringify(origins, null, 1) + "\n");
writeFileSync("gate/data/trips-snapshot.json", JSON.stringify(snapshot, null, 1) + "\n");
console.log(`exported ${snapshot.length} trips (${flyable} flyable) to gate/data/trips-snapshot.json`);
console.log(`exported ${origins.length} origin metros to gate/data/origins.json`);
