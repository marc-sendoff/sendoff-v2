/* ============ ONE PRICE PER TRIP ============
   Every number the site shows for a trip comes through priceTrip(). Cards,
   the wheel, the budget filter, the detail sheet, the share text: all of them
   read `cost` off a trip that has been through here, never off trips.js.

   Two price systems used to coexist: the hand-typed `cost` in trips.js (and
   its ratio-split breakdown, 45% of it assumed to be the flight) and the
   nightly Travelpayouts fares that only the "cheapest live" rail looked at.
   Measured from Miami on 2026-09-08, live totals beat the card price on 78
   of 92 trips, median gap $172. So:

   - LIVE: when the cheapest data has a fare for this trip from this origin,
     the travel line IS that fare and the total is fare + ground.
   - EST: otherwise the curated travel line stands. Labelled as an estimate.
   - Either way the stay line is split by crew (stayPerPerson below), and the
     existing drive-vs-fly logic in originBreakdown() still gets the last word
     (a $40 tank of gas beats a $180 fare when you can drive).

   stayPerPerson mirrors gate/src/cheapest.js so the server's ground figure
   and the browser's agree. Change both together. */
import { originBreakdown } from "./config.js";

/* The curated stay number is what ONE person pays when TWO share. A room
   sleeps up to four and its price is shared; a solo traveller pays more than
   half a double (1.4x), three sharing pay 0.8x, four 0.65x. Bigger crews
   split into rooms of four and pay whatever that average occupancy pays,
   interpolated. A model, not a survey: stated once, applied everywhere. */
export const STAY_SHARE = { 1: 1.4, 2: 1, 3: 0.8, 4: 0.65 };
export const ROOM_CAP = 4;
export function stayPerPerson(stay, crew = 1) {
  const s = Number(stay);
  if (!Number.isFinite(s) || s <= 0) return 0;
  const n = Math.max(1, Math.floor(Number(crew) || 1));
  const occupancy = n <= ROOM_CAP ? n : n / Math.ceil(n / ROOM_CAP);
  const lo = Math.floor(occupancy), hi = Math.ceil(occupancy);
  const f = lo === hi ? STAY_SHARE[lo] : STAY_SHARE[lo] + (STAY_SHARE[hi] - STAY_SHARE[lo]) * (occupancy - lo);
  return Math.round(s * f);
}

/* One priced copy of a trip. `live` is the /api/cheapest row for this trip
   (or undefined). Never mutates the catalog entry. */
export function priceTrip(t, { oc = null, crew = 1, live = undefined } = {}) {
  const b = t.breakdown;
  if (!b) return { ...t, curatedCost: t.cost, priceSource: "est", fare: null, fareMonth: null };
  const fare = live && t.fly && Number.isFinite(live.farePerPerson) && live.farePerPerson > 0
    ? Math.round(live.farePerPerson) : null;
  const pre = { ...t, breakdown: { ...b, travel: fare ?? b.travel, stay: stayPerPerson(b.stay, crew) } };
  const adj = originBreakdown(pre, oc);
  return {
    ...t,
    cost: adj.total,
    breakdown: adj.breakdown,
    curatedCost: t.cost,
    /* "live" only when the live fare survived as the travel line; if driving
       won, the number is our estimate again and says so */
    priceSource: fare !== null && adj.breakdown.travel === fare ? "live" : "est",
    fare,
    fareMonth: live?.fareMonth ?? null,
  };
}

export function priceAll(trips, ctx) {
  const live = ctx.live instanceof Map ? ctx.live : new Map();
  return trips.map((t) => priceTrip(t, { ...ctx, live: live.get(t.id) }));
}

/* The tag next to a price. Short on purpose: it sits under "/person". */
export const priceTag = (t) => (t.priceSource === "live" ? "live fare" : "est.");
