// Cheapest-total ranking: marry a live-ish airfare with the curated on-ground
// budget for every flyable trip, and rank destinations by what the whole trip
// actually costs per person. Pure functions, no I/O — covered by
// test/cheapest.test.mjs.
//
// WHY THIS IS THE INTERESTING NUMBER: every fare tool answers "cheapest flight
// to X". None answer "where can 4 of us go for the least money, all in".
// Fare alone ranks Vegas above Mexico City; fare + ground often flips it.
//
// THE ONE NUMBERS CAVEAT, stated once and honestly:
// `ground` in the trips snapshot is derived — trips.js splits the curated
// all-in `cost` by fixed ratios (flying trips: 45% travel / 25% stay / 18%
// food / 12% fun) and `ground` is cost minus the travel share. It is a
// good-faith estimate, not a researched per-destination ground budget. Two
// consequences we do NOT paper over:
//   1. The crew split touches ONLY the stay line. The snapshot carries `stay`
//      (the breakdown's lodging share) next to `ground`; stayPerPerson()
//      below rescales it for the crew and food/fun stay per person. A
//      snapshot row without `stay` is crew-invariant, as before. The same
//      model lives in src/data/pricing.js so the browser's card price and
//      this ranker agree. Change both together.
//   2. totalCrew is a straight multiply of the crew-adjusted per-person
//      figure: fare is per seat, ground is per person.

export const STALE_AFTER_MS = 48 * 60 * 60 * 1000; // 48h: still served, flagged stale
export const MAX_FARE = 100_000; // above this a cached fare is corrupt, not expensive

/* The curated stay number is what ONE person pays when TWO share. A room
   sleeps up to four and its price is shared; solo pays 1.4x, three sharing
   pay 0.8x, four 0.65x, bigger crews split into rooms of four and pay the
   interpolated average occupancy. Mirror of src/data/pricing.js. */
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

/* Per-person on-ground budget for this crew: the curated ground with its
   stay share swapped for the crew-split stay. */
export function groundPerPerson(trip, crew = 1) {
  const g = Number(trip?.ground);
  if (!Number.isFinite(g) || g <= 0) return null;
  const stay = Number(trip?.stay);
  if (!Number.isFinite(stay) || stay <= 0 || stay > g) return Math.round(g);
  return Math.round(g - stay + stayPerPerson(stay, crew));
}

/* One ranked row, or null when the inputs can't make an honest number. */
export function buildRow(trip, fare, crew = 1) {
  if (!trip?.id || !trip?.fly) return null;
  const n = normalizeCrew(crew);
  const ground = groundPerPerson(trip, n);
  const farePerPerson = Number(fare?.price);
  // A zero or negative fare is bad cache data, not a free flight — drop the
  // row rather than crown it the cheapest destination on earth. The ceiling
  // catches absurd cache values (1e308 would overflow totalCrew to Infinity,
  // which JSON.stringify emits as null and breaks the contract's number type).
  if (ground === null || !Number.isFinite(farePerPerson)
    || farePerPerson < 1 || farePerPerson > MAX_FARE) return null;
  const totalPerPerson = Math.round(farePerPerson + ground);
  return {
    tripId: trip.id,
    dest: String(trip.fly).toUpperCase(),
    fareMonth: typeof fare.month === 'string' ? fare.month : null,
    farePerPerson: Math.round(farePerPerson),
    groundPerPerson: ground,
    totalPerPerson,
    totalCrew: totalPerPerson * n,
    days: Number.isFinite(Number(trip.days)) ? Number(trip.days) : null,
  };
}

/* Crew size: clamped to something a group trip can actually mean. */
export function normalizeCrew(crew) {
  const n = Math.floor(Number(crew));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 24);
}

/* Rank every flyable trip we have a fare for. `fares` maps IATA -> {price, month}.
   Several trips can share one destination airport (196 codes across 223 trips),
   so a single fare legitimately feeds multiple rows.
   `origin` (optional) drops trips whose destination IS the origin: a stray
   MIA->MIA fare in the cache would otherwise rank "fly to your own city" as a
   real trip. Judged on the destination code, never on a trip-id blocklist, so
   the same trip still ranks normally from every other origin. */
export function rankTrips(trips, fares, crew = 1, origin = null) {
  const n = normalizeCrew(crew);
  const home = typeof origin === 'string' ? origin.toUpperCase() : null;
  const rows = [];
  for (const trip of trips ?? []) {
    if (!trip?.fly) continue; // drive-only trips have no fare to add
    const dest = String(trip.fly).toUpperCase();
    if (home && dest === home) continue; // you already live there
    const fare = fares?.[trip.fly];
    if (!fare) continue;
    const row = buildRow(trip, fare, n);
    if (row) rows.push(row);
  }
  // ascending by total; ties broken by fare then trip id so the order is stable
  rows.sort((a, b) => a.totalPerPerson - b.totalPerPerson
    || a.farePerPerson - b.farePerPerson
    || String(a.tripId).localeCompare(String(b.tripId)));
  return rows;
}

/* The frozen /api/cheapest response shape. `updatedAt` is the pull time; data
   older than 48h still serves (a stale ranking beats no ranking) but says so. */
export function buildResponse({ origin, crew, trips, fares, updatedAt, now = Date.now() }) {
  const n = normalizeCrew(crew);
  const home = String(origin ?? '').toUpperCase();
  const results = rankTrips(trips, fares, n, home);
  const ts = Date.parse(updatedAt);
  const stale = Number.isFinite(ts) ? now - ts > STALE_AFTER_MS : true;
  return {
    origin: String(origin ?? '').toUpperCase(),
    updatedAt: Number.isFinite(ts) ? new Date(ts).toISOString() : null,
    crew: n,
    ...(stale ? { stale: true } : {}),
    results,
  };
}

export const IATA_RE = /^[A-Z]{3}$/;

/* ---------- deal discovery ----------
   A "deal" is a route whose cheapest observed fare sits well below that
   route's OWN typical fare. `typical` is the median of every fare the pull
   saw for the route (across months and dates); `n` is how many it saw. Both
   are written by the puller. A route with too few samples cannot back a
   discount claim, so it is skipped rather than guessed: we never print a
   "was" price the data did not show us. */
export const DEAL_MIN_SAMPLES = 5;
export const DEAL_MAX_RATIO = 0.7; // cheapest must be <= 70% of typical (30%+ off)

export function findDeals(trips, fares, { minSamples = DEAL_MIN_SAMPLES, maxRatio = DEAL_MAX_RATIO, limit = 8 } = {}) {
  if (!Array.isArray(trips) || !fares || typeof fares !== 'object') return [];
  const byDest = new Map();
  for (const t of trips) {
    // one card per destination: the trip with the lowest ground budget
    if (!t?.id || !t?.fly) continue;
    const prev = byDest.get(t.fly);
    if (!prev || (Number(t.ground) || Infinity) < (Number(prev.ground) || Infinity)) byDest.set(t.fly, t);
  }
  const out = [];
  for (const [dest, f] of Object.entries(fares)) {
    const t = byDest.get(String(dest).toUpperCase());
    if (!t) continue;
    const price = Number(f?.price), typical = Number(f?.typical), n = Number(f?.n);
    if (!Number.isFinite(price) || price <= 0 || price > MAX_FARE) continue;
    if (!Number.isFinite(typical) || typical <= 0 || !Number.isFinite(n) || n < minSamples) continue;
    if (price > typical * maxRatio) continue;
    out.push({
      tripId: t.id, dest: t.fly, price: Math.round(price), typical: Math.round(typical), n: Math.trunc(n),
      off: Math.round((1 - price / typical) * 100), month: String(f.month ?? '').slice(0, 7),
    });
  }
  out.sort((a, b) => b.off - a.off || a.price - b.price || a.tripId.localeCompare(b.tripId));
  return out.slice(0, limit);
}

/* ---------- rolling price history ----------
   One cached snapshot cannot say what a route "normally" costs: the cache
   skews toward the cheap fares people searched, so a same-night median hugs
   the floor. A rolling history can. Each pull appends today's cheapest fare
   per route and keeps the last HISTORY_DAYS entries; `typical` becomes the
   median over that window plus tonight's samples, and `n` counts them all.
   Pure: the puller feeds it the previous file's history and writes the result. */
export const HISTORY_DAYS = 30;

export function mergeHistory(prevHistory, fares, today, samples = new Map(), days = HISTORY_DAYS) {
  const history = {};
  const day = String(today).slice(0, 10);
  for (const [dest, f] of Object.entries(fares ?? {})) {
    const price = Number(f?.price);
    if (!Number.isFinite(price) || price <= 0) continue;
    const prev = Array.isArray(prevHistory?.[dest]) ? prevHistory[dest] : [];
    const kept = prev.filter((h) => h && h.d !== day && Number.isFinite(Number(h.p)) && Number(h.p) > 0);
    kept.push({ d: day, p: Math.round(price) });
    kept.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
    history[dest] = kept.slice(-days);
    const pool = [...history[dest].map((h) => Number(h.p)), ...(samples.get(dest) ?? [])]
      .filter((p) => Number.isFinite(p) && p > 0).sort((a, b) => a - b);
    const mid = Math.floor(pool.length / 2);
    f.typical = Math.round(pool.length % 2 ? pool[mid] : (pool[mid - 1] + pool[mid]) / 2);
    f.n = pool.length;
  }
  return history;
}
