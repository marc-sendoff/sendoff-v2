/* Fare alerts for watched sends (Sendoff+). Runs ten past every hour, after
   pull-fares has refreshed an origin.

   For every row in public.watches: read the latest fare for
   home base → trip airport. First time it's seen, that fare becomes the
   baseline. When the fare is 10%+ under the baseline (and no email in the
   last 20h) the watcher gets one email and the baseline resets to the new
   low, so a further drop alerts again. Rising fares nudge the baseline up
   slowly so a later dip back still counts.

   Also keeps typical/<ORIGIN>: a running average per destination, which
   /api/deals compares live fares against. Nothing else writes it. */
import { getStore } from "@netlify/blobs";
import { readFileSync } from "node:fs";
import { admin } from "../lib/auth.mjs";
import { sendEmail, layout, P, esc, SITE } from "../lib/email.mjs";

const TRIPS = JSON.parse(readFileSync(new URL("../data/trips-snapshot.json", import.meta.url), "utf8"));
const BY_ID = new Map(TRIPS.map((t) => [t.id, t]));
const DROP = 0.9;                 // alert at 10% under the baseline
const THROTTLE_MS = 20 * 60 * 60 * 1000;
const TYPICAL_MAX_N = 40;

const month = (m) => (m ? new Date(m + "-15T12:00:00Z").toLocaleDateString("en-US", { month: "long" }) : "soon");

async function updateTypical(store, origin, doc) {
  const key = `typical/${origin}`;
  const cur = (await store.get(key, { type: "json" }).catch(() => null)) ?? { origin, seenAt: null, dests: {} };
  if (cur.seenAt === doc.updatedAt) return cur;   // same pull as last hour: don't count it twice
  for (const [dest, f] of Object.entries(doc.fares ?? {})) {
    if (f?.seenAt !== doc.updatedAt) continue;      // only fares refreshed by this pull
    const d = cur.dests[dest] ?? { typical: f.price, n: 0 };
    const n = Math.min(d.n, TYPICAL_MAX_N);
    d.typical = Math.round((d.typical * n + f.price) / (n + 1));
    d.n = d.n + 1;
    d.low = Math.min(d.low ?? f.price, f.price);
    cur.dests[dest] = d;
  }
  cur.seenAt = doc.updatedAt; cur.updatedAt = new Date().toISOString();
  await store.setJSON(key, cur);
  return cur;
}

export default async () => {
  const store = getStore("fares");
  const db = admin();
  const { data: rows, error } = await db.from("watches").select("user_id, trip_id, origin, base_price, last_price, last_alert_at");
  if (error) { console.error("fare-alerts:", error.message); return new Response("db error", { status: 500 }); }

  const origins = [...new Set((rows ?? []).map((r) => r.origin).filter(Boolean))];
  const docs = {};
  for (const o of origins) {
    docs[o] = await store.get(`fares/${o}`, { type: "json" }).catch(() => null);
    if (docs[o]) await updateTypical(store, o, docs[o]);
  }
  /* typical also needs updating for origins nobody is watching yet, so deals work everywhere */
  for (const o of ["MIA", "MCO", "TPA", "JAX", "FLL", "PNS", "RSW", "ATL", "NYC", "ORD", "DFW", "LAX"]) {
    if (docs[o] !== undefined) continue;
    const d = await store.get(`fares/${o}`, { type: "json" }).catch(() => null);
    if (d) await updateTypical(store, o, d);
  }

  const now = Date.now();
  let emailed = 0, baselined = 0;
  for (const r of rows ?? []) {
    const trip = BY_ID.get(r.trip_id); const doc = docs[r.origin];
    if (!trip?.fly || !doc?.fares) continue;
    const f = doc.fares[String(trip.fly).toUpperCase()];
    if (!f?.price) continue;
    const price = f.price;
    const patch = { last_price: price };
    if (!r.base_price) { patch.base_price = price; baselined++; }
    else if (price <= r.base_price * DROP) {
      const recent = r.last_alert_at && now - Date.parse(r.last_alert_at) < THROTTLE_MS;
      if (!recent) {
        const { data: u } = await db.auth.admin.getUserById(r.user_id);
        const email = u?.user?.email;
        if (email) {
          const { data: prof } = await db.from("profiles").select("name").eq("id", r.user_id).maybeSingle();
          const first = String(prof?.name || "").trim().split(/\s+/)[0];
          const name = trip.name.split(",")[0];
          const href = `${SITE}/?trip=${encodeURIComponent(trip.id)}`;
          const html = layout({
            kicker: `Fare drop · ${r.origin} → ${trip.fly}`,
            headline: `${esc(name)} just dropped to <span style="color:#2547F0;border-bottom:5px solid #FFC838;">$${price}.</span>`,
            bodyHtml: `<p style="${P}">${first ? "Hey " + esc(first) + " &mdash;" : "Hey &mdash;"}</p>
<p style="${P}">The round-trip fare from ${esc(r.origin)} to ${esc(name)} is <strong>$${price}</strong> right now, down from $${r.base_price} when you started watching. ${month(f.month)} departures. Fares like this move fast.</p>
<p style="${P}">Open the trip, tap the flight, and you're on the airline's site with these dates.</p>`,
            cta: `Open ${name}`, ctaHref: href,
            footer: `You're getting this because you're watching ${esc(name)} on Sendoff+. Stop watching from your profile on <a href="${SITE}" style="color:#1B1D2A;">sendofftrips.com</a>.`,
          });
          const ok = await sendEmail({ to: email, subject: `${name} just dropped to $${price} from ${r.origin}`, html,
            text: `${name} is $${price} round trip from ${r.origin} right now (was $${r.base_price}). ${href}` });
          if (ok) { emailed++; patch.last_alert_at = new Date().toISOString(); patch.base_price = price; }
        }
      }
    } else if (price > r.base_price) {
      patch.base_price = Math.round(r.base_price * 0.7 + price * 0.3);  // drift up slowly
    }
    await db.from("watches").update(patch).eq("user_id", r.user_id).eq("trip_id", r.trip_id);
  }
  const out = { watching: rows?.length ?? 0, origins: origins.length, baselined, emailed };
  console.log(JSON.stringify(out));
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
};

export const config = { schedule: "10 * * * *" };
