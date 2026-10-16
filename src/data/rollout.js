/* ============ ROLLOUT ============
   Who can set their home base, and when. Florida first, then the US, then
   the world. The destinations never change; only the ORIGIN picker is gated.
   Someone in Ohio on Nov 3 can browse every trip but cannot set Ohio as home
   until Nov 15 and sees "we open in your city on Nov 15" instead.

   Dates are local to the visitor; a midnight launch is fine for this.
   ?rollout=us or ?rollout=world on the URL previews a later stage. */
import { CITIES, WORLD_CITIES } from "./cities.js";

export const STAGES = [
  { id: "florida", label: "Florida",          opens: "2026-11-01" },
  { id: "us",      label: "the rest of the US", opens: "2026-11-15" },
  { id: "world",   label: "everywhere else",    opens: "2026-12-10" },
];

export const FLORIDA_CITIES = [
  "Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "West Palm Beach", "Fort Myers",
  "Sarasota", "Pensacola", "Tallahassee", "Gainesville", "Daytona Beach", "Boca Raton", "Key West",
  "St. Petersburg", "Naples", "Melbourne",
];
const FLORIDA_SET = new Set(FLORIDA_CITIES.map((c) => c.toLowerCase()));
const WORLD_SET = new Set(WORLD_CITIES.map((w) => String(w.name || "").toLowerCase()));

export function stageOf(city) {
  const c = String(city || "").toLowerCase();
  if (FLORIDA_SET.has(c)) return "florida";
  if (WORLD_SET.has(c)) return "world";           // world entries are merged into CITIES, so check them first
  if (/,\s*[a-z]/.test(c) && !/,\s*(fl|florida|usa|us)$/.test(c)) return "world"; // "Town, Country" typed by hand
  return "us";                                     // curated US city, or a free-typed US town
}

/* The furthest stage that is open today. Before Nov 1 nothing is open: the
   public site is the signup page and /preview behaves as if Florida were. */
export function currentStage(now = new Date()) {
  const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("rollout") : null;
  if (q && STAGES.some((s) => s.id === q)) return q;
  const today = now.toISOString().slice(0, 10);
  let open = "florida";
  for (const s of STAGES) if (today >= s.opens) open = s.id;
  return open;
}
const ORDER = { florida: 0, us: 1, world: 2 };
export const isOpen = (city, stage = currentStage()) => ORDER[stageOf(city)] <= ORDER[stage];
export const opensOn = (city) => STAGES[ORDER[stageOf(city)]];
export const niceDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" });

/* Cities the picker may list for the current stage. */
export function openCities(stage = currentStage()) {
  if (stage === "florida") return FLORIDA_CITIES.filter((c) => c in CITIES);
  if (stage === "us") return Object.keys(CITIES).filter((c) => !WORLD_SET.has(c.toLowerCase()));
  return Object.keys(CITIES);
}
