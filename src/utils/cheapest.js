import FIXTURE from "../data/cheapest-fixture.json";

/* Cheapest-actual-sends data plumbing. Frozen contract with the data lane:
   GET /api/cheapest?origin=MIA&crew=4 ->
   { origin, updatedAt, crew, stale?, results:[{ tripId, dest, fareMonth,
     farePerPerson, groundPerPerson, totalPerPerson, totalCrew, days }] }
   sorted ascending by totalPerPerson.

   Fallback chain: live endpoint -> bundled fixture (same shape, MIA only)
   -> null, which HIDES the surface. Callers must render nothing on null —
   never an empty or broken row. Fixture/stale results carry stale:true so
   the UI can show a quiet "prices from <date>" note. */

const shapeOk = (d) =>
  d && typeof d === "object" && typeof d.origin === "string" && Array.isArray(d.results) &&
  d.results.length > 0 &&
  d.results.every((r) => r && typeof r.tripId === "string" &&
    Number.isFinite(r.farePerPerson) && Number.isFinite(r.groundPerPerson) &&
    Number.isFinite(r.totalPerPerson) && Number.isFinite(r.days));

export async function getCheapest(origin, crew, fetchFn = fetch) {
  if (!/^[A-Z]{3}$/.test(origin || "")) return null;
  const n = Math.max(1, crew || 1);
  let data = null;
  let live = false;
  try {
    const r = await fetchFn(`/api/cheapest?origin=${origin}&crew=${n}`, { headers: { Accept: "application/json" } });
    if (r.ok) {
      const j = await r.json();
      if (shapeOk(j) && j.origin === origin) { data = j; live = true; }
    }
  } catch { /* endpoint not there yet — fixture next */ }
  if (!data && shapeOk(FIXTURE) && FIXTURE.origin === origin) data = FIXTURE;
  if (!data) return null;
  /* defensive sort (contract says ascending, trust but verify) and crew-total
     recompute so a crew change never shows the payload's old multiplication */
  const results = [...data.results]
    .sort((a, b) => a.totalPerPerson - b.totalPerPerson)
    .map((r) => ({ ...r, totalCrew: r.totalPerPerson * n }));
  return {
    origin: data.origin,
    updatedAt: data.updatedAt,
    crew: n,
    results,
    stale: Boolean(data.stale) || !live,
  };
}
