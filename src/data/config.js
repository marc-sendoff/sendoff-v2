import { T } from "../theme.js";
import { AIRPORTS } from "./trips.js";

/* ---------- display currency ----------
   Every number in the catalog is USD. The app sets the viewer's currency from
   their origin (world-cities.js carries it) plus the day's rate from
   /api/rates, and fmt() converts at render. Fallback is USD, unconverted.
   Set once per render in App, read by every fmt() call site below it. */
let CUR = { code: "USD", rate: 1 };
const FMTS = new Map();
export function setCurrency(code, rate) {
  const r = Number(rate);
  CUR = { code: /^[A-Z]{3}$/.test(code || "") && r > 0 ? code : "USD", rate: /^[A-Z]{3}$/.test(code || "") && r > 0 ? r : 1 };
}
export const currency = () => CUR;
export const fmt = (n) => {
  let f = FMTS.get(CUR.code);
  if (!f) {
    try { f = new Intl.NumberFormat("en", { style: "currency", currency: CUR.code, minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
    catch { f = new Intl.NumberFormat("en", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
    FMTS.set(CUR.code, f);
  }
  return f.format(Math.round(Number(n) * CUR.rate));
};

/* ---------- Sendoff+ deal drops (sample data — live API later) ---------- */
export const DEALS = [
  { tripId: "cartagena", price: 198, was: 470, expires: "2 days", note: "Rare mistake-fare territory" },
  { tripId: "sanjuan", price: 118, was: 260, expires: "3 days", note: "Spring window just opened" },
  { tripId: "denver", price: 138, was: 310, expires: "5 days", note: "Midweek departures only" },
  { tripId: "lisbon", price: 398, was: 780, expires: "36 hrs", note: "Cheapest Europe fare this year" },
  { tripId: "tulum", price: 164, was: 340, expires: "4 days", note: "Beat the spring break surge" },
];
/* What Sendoff+ actually does today — nothing on this list is a promise the
   site can't keep. Texts, partner codes and "first month free" were here once
   and none of them exist; a perk that isn't real is a refund waiting to
   happen. "Deal drops" gets its origin filled in by the Plus modal. */
export const PLUS_PERKS = [
  ["🔓", "Every send unlocked", "All of them in your budget, not just the first few"],
  ["🔥", "Deal drops", "Every drop from your city, the day the fare lands"],
  ["⚡", "Live fares", "Real round-trip prices, refreshed a few times a day"],
  ["🎡", "Spin-Send", "The wheel picks your trip; book it and bank Send Points"],
  ["🎓", "Student deal", "College email? 5% off, every renewal"],
  ["✦", "Founders seats", "Go yearly and you're one of the first ten"],
];

/* ---------- geo helpers ---------- */
export const toRad = (d) => (d * Math.PI) / 180;
export function miles(lat1, lon1, lat2, lon2) {
  const R = 3959, dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
/* A drive under 40 miles is minutes, not "0 hr": Miami to Miami Beach is a
   half-hour across the causeway, not a flight. Town speeds, rounded to 5. */
const driveLabel = (mi) => (mi < 40
  ? `${Math.max(30, Math.round((mi / 30) * 60 / 5) * 5)} min drive`   // never under 30: city traffic is real
  : `${Math.max(1, Math.round(mi / 62))} hr drive`);

export function modeLabel(t, oc) {
  if (!oc) return t.driveOnly ? "road trip · split gas" : "flight";
  const mi = miles(oc[0], oc[1], t.lat, t.lon);
  const driveH = Math.max(1, Math.round(mi / 62));
  const flightH = Math.max(1, mi / 480 + 0.6).toFixed(1);
  if (mi < 40) return driveLabel(mi);                       // you live there: no one flies 10 miles
  if (t.driveOnly) return `${driveLabel(mi)} · split gas`;
  if (t.canDrive && driveH <= 16) return `${flightH} hr flight · or ${driveH} hr drive`;
  return `${flightH} hr flight`;
}

/* Origin-aware "where the money goes". The data's breakdown assumes a
   typical origin — re-figure the travel line from where you actually live.
   Gas math: round trip at ~$0.14/mi (25 mpg, $3.50/gal), split across the
   ACTUAL crew. Flyable trips are PRICED AS FLYING (the headline number must
   match what the Flights button shows) — when driving is cheaper, that comes
   back as driveGas/driveH so the UI can pitch the road trip as the savings
   tip instead of silently baking it into the math (decided 2026-08-31). */
export function originBreakdown(t, oc, crew = 4) {
  const b = t.breakdown;
  const none = { mode: "fly", driveGas: null, driveH: null };
  if (!b) return { breakdown: b, total: t.cost, local: false, ...none };
  /* No origin: the lines still add up to the total (pricing.js may have
     swapped the travel line for a live fare or split the stay by crew). */
  if (!oc) return { breakdown: b, total: b.travel + b.stay + b.food + b.fun, local: false, ...none };
  const mi = miles(oc[0], oc[1], t.lat, t.lon);
  const split = Math.max(1, Math.round(crew) || 1);
  const gas = Math.max(20, Math.round((mi * 2 * 0.14) / split / 5) * 5);
  let travel = b.travel, mode = "fly", driveGas = null, driveH = null;
  if (mi < 40) { travel = 15; mode = "local"; } /* you live there — it's rideshare money */
  else if (t.driveOnly) { travel = gas; mode = "drive"; }
  else if (t.canDrive && mi / 62 <= 16 && gas < b.travel) {
    driveGas = gas; driveH = Math.round(mi / 62); /* flying stays the priced path */
  }
  const total = travel + b.stay + b.food + b.fun;
  return { breakdown: { ...b, travel }, total, local: mi < 40, mode, driveGas, driveH };
}

/* ============================================================
   AFFILIATE CONFIG — the only block you edit to start earning.
   Paste your IDs between the quotes. Leave "" and that partner
   is simply skipped, so the site works fine before approval.

   WHERE TO GET EACH ID:
   • travelpayouts  → travelpayouts.com → Profile → your marker (e.g. "654321")
     One marker powers Kiwi flights, Hostelworld, Booking.com,
     GetYourGuide and Discover Cars below.
   • bookingAid     → inside Travelpayouts, join the Booking.com program;
     it gives an "aid" number. If blank, Booking is skipped.
   ============================================================ */
/* ============================================================
   STRIPE — Sendoff+ subscription payment links.
   Create two Payment Links in Stripe (one monthly, one yearly),
   paste the URLs here. Leave blank and the button stays in
   demo mode instead of sending anyone to a broken checkout.
   ============================================================ */
export const STRIPE = {
  monthly: "",   // ← paste the $3.99/month payment link
  yearly: "",    // ← paste the $34.99/year payment link
};

/* The Sendoff+ access code moved server-side: gate service /api/plus-code,
   PLUS_ACCESS_CODE in gate.env. Never put it back in the bundle. */

export const AFF = {
  travelpayouts: "763771",   // real account marker — verified live 2026-08-30 (sp.booking.com attribution); 561612 was a never-used placeholder
  bookingAid: "",            // ← paste Booking.com aid here once approved
};

export const tp = (base, params = {}) => {
  const u = new URL(base);
  Object.entries(params).forEach(([k, v]) => v && u.searchParams.set(k, v));
  if (AFF.travelpayouts) u.searchParams.set("marker", AFF.travelpayouts);
  return u.toString();
};

/* Cities where Go City sells an all-in-one attraction pass */
export const GOCITY = ["New York","Las Vegas","Los Angeles","San Diego","San Francisco","Chicago","Boston",
  "Miami","Orlando","New Orleans","Washington DC","Philadelphia","Seattle","Dallas","Atlanta","Toronto",
  "Cancún","London","Paris","Rome","Barcelona","Madrid","Berlin","Amsterdam","Dublin","Lisbon","Vienna",
  "Copenhagen","Stockholm","Istanbul","Dubai","Sydney","Singapore","Bangkok","Hong Kong","Tokyo"];

/* Booking links — partners you're approved for.
   NOTE: these point at each partner's own site. Prefilled search URLs get
   changed by these companies often, so we link to the real page and tell
   the user what to search. Travelpayouts Drive tags the click either way. */
/* ============================================================
   PARTNER LINKS — paste the tracked link Travelpayouts gives you
   ("Generate links" → copy the short link) between the quotes.
   These carry your tracking, so clicks actually count.
   Leave one blank and that button simply won't show.
   ============================================================ */
export const PARTNER = {
  klook:       "https://klook.tpk.lv/FfTSyUDu",  // stays + things to do
  kiwi:        "https://kiwi.tpk.lv/gBLy8AtE",   // flights
  aviasales:   "https://aviasales.tpk.lv/HHI5qNeP",   // compare flights
  gettransfer: "https://gettransfer.tpk.lv/zwUZenfu",   // airport rides
  gocity:      "https://gocity.tpk.lv/Huu45SLc",   // city passes
  wegotrip:    "https://wegotrip.tpk.lv/x5gPZwS7",   // audio tours
};

/* --- Deep links (2026-08-29): land people on RESULTS for their exact trip
   instead of partner homepages. The affiliate ids below are extracted from
   what the tpk.lv shortlinks actually redirect through, so attribution is
   identical to the old buttons. Each format was verified live; partners
   with no verified deep format keep their homepage shortlink. --- */
const DEEP = {
  aviasalesMarker: "763771",
  kiwiAffilid: "travelpayoutsdeeplink_sendoff-site.netlify.app_1ef0fee63cf6472d94dbbc66c-763771",
  klookAid: "api|13694|e21869b8848343fd8345186a5-763771|pid|763771",
};
const IATA = (c) => /^[A-Z]{3}$/.test(c || "");
const ddmm = (iso) => { const [, m, d] = iso.split("-"); return `${d}${m}`; };

export function deepFlights(originCode, destCode, dates, pax) {
  if (!dates.out || !dates.back || !IATA(originCode) || !IATA(destCode)) return null;
  return `https://www.aviasales.com/search/${originCode}${ddmm(dates.out)}${destCode}${ddmm(dates.back)}?passengers=${pax || 1}&marker=${DEEP.aviasalesMarker}`;
}
export function deepKiwi(originCode, destCode, dates) {
  if (!destCode) return null;
  const u = new URL("https://www.kiwi.com/deep");
  u.searchParams.set("affilid", DEEP.kiwiAffilid);
  if (originCode) u.searchParams.set("from", originCode);
  u.searchParams.set("to", destCode);
  if (dates.out) u.searchParams.set("departure", dates.out);
  if (dates.back) u.searchParams.set("return", dates.back);
  return u.toString();
}
export function deepKlook(query) {
  const target = `https://www.klook.com/en-US/search/result/?query=${encodeURIComponent(query)}`;
  return `https://affiliate.klook.com/redirect?aid=${encodeURIComponent(DEEP.klookAid)}&k_site=${encodeURIComponent(target)}`;
}

export function bookLinks(t, origin, oc, friends, dates) {
  const links = [];
  const mi = oc ? miles(oc[0], oc[1], t.lat, t.lon) : null;
  const driveH = mi ? Math.round(mi / 62) : null;
  const cityOnly = t.name.split(",")[0].trim();   // keeps multi-stop names like "Cancún → Tulum"
  const originCode = AIRPORTS[origin] || origin;
  const hasDates = dates.out && dates.back;
  const when = hasDates ? `${dates.out} → ${dates.back}` : "your dates";

  if (t.fly && PARTNER.kiwi) {
    links.push({ label: "Flights", sub: `${originCode} → ${t.fly}, ${when} — opens prefilled`,
      emoji: "✈️", color: T.cobalt, dark: true,
      url: deepKiwi(originCode, t.fly, dates) || PARTNER.kiwi });
  }
  if (t.fly && PARTNER.aviasales) {
    links.push({ label: "Compare flights", sub: `Same route, ${when} — check both prices`,
      emoji: "🔍", color: "#B8A9E8",
      url: deepFlights(originCode, t.fly, dates, friends) || PARTNER.aviasales });
  }
  if (PARTNER.klook) {
    links.push({ label: "Stays", sub: `${cityOnly} results open ready — ${friends} ${friends === 1 ? "guest" : "guests"}, ${when}`,
      emoji: "🏨", color: "#9BD3AE", url: deepKlook(cityOnly) });
    links.push({ label: "Things to do", sub: `${cityOnly} — tours, tickets, day trips, ready to browse`,
      emoji: "🎟️", color: "#FFB088", url: deepKlook(cityOnly) });
  }
  if (PARTNER.gocity && GOCITY.some((c) => cityOnly.toLowerCase().includes(c.toLowerCase()))) {
    links.push({ label: "City pass", sub: `Pick ${cityOnly} — one pass covers the big attractions`,
      emoji: "🎫", color: T.sun, url: PARTNER.gocity });
  }
  if (PARTNER.wegotrip) {
    links.push({ label: "Audio tours", sub: `Search ${cityOnly} — self-guided, a few dollars`,
      emoji: "🎧", color: "#8FD8E8", url: PARTNER.wegotrip });
  }
  if (t.fly && PARTNER.gettransfer) {
    links.push({ label: "Airport ride", sub: friends > 1 ? `${t.fly} → ${cityOnly}, split ${friends} ways` : `${t.fly} → ${cityOnly}`,
      emoji: "🚐", color: "#E8A0BF", url: PARTNER.gettransfer });
  }
  if (t.driveOnly && driveH) {
    links.push({ label: "The drive", sub: friends > 1 ? `~${driveH} hr from ${origin} · split gas ${friends} ways` : `~${driveH} hr from ${origin}`,
      emoji: "🚗", color: T.sun,
      url: `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(t.city)}` });
  }
  return links;
}

/* Group-chat share text */
export function shareText(t, origin, oc, friends, dates) {
  const dstr = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const when = dates.out && dates.back ? `📅 ${dstr(dates.out)} → ${dstr(dates.back)}` : `📅 dates — vote below`;
  return [
    `🛫 TRIP DROP: ${t.img} ${t.name.toUpperCase()}`,
    `"${t.tag}"`,
    ``,
    friends > 1
      ? `💸 ${fmt(t.cost)}/person · ${fmt(t.cost * friends)} total for ${friends} of us`
      : `💸 ${fmt(t.cost)} all in`,
    `📍 ${t.days} days from ${origin} · ${modeLabel(t, oc)}`,
    when,
    ``,
    `The move: ${t.plan[0].replace(/^Day 1 — /, "")}`,
    ``,
    `Reply 🔥 if you're in. Planned on Sendoff ✈️`,
  ].join("\n");
}

/* Personal Sendoff fee by membership: Founders $5, Plus $7, everyone else
   $10. Quoted on the form and in the request email; nothing is charged online. */
export const PERSONAL_FEE = { founder: 5, plus: 7, free: 10 };
export const personalFee = (plan) => PERSONAL_FEE[plan] ?? PERSONAL_FEE.free;

/* The Big Send planning fee, per person, by the applicant's membership. */
export const BIG_SEND_FEE = { founder: 10, plus: 15, free: 20 };
export const bigSendFee = (plan) => BIG_SEND_FEE[plan] ?? BIG_SEND_FEE.free;

export const CUSTOM_CONTACT_EMAIL = "support@sendofftrips.com";
export const INSTAGRAM_HANDLE = "sendoff.trips";
export const INSTAGRAM_URL = "https://www.instagram.com/sendoff.trips/";
/* Formspree endpoint — requests from both forms get emailed here automatically */
export const FORM_ENDPOINT = "https://formspree.io/f/xbgrovlz";

/* Send a request to Formspree. Returns true if it went through. */
window.__SENDOFF_LAST_ERROR = "";
export async function sendRequest(kind, fields) {
  try {
    const fd = new FormData();
    fd.append("_subject", kind);
    fd.append("request_type", kind);
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      body: fd,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      let detail = "HTTP " + res.status;
      try {
        const j = await res.json();
        if (j && j.errors) detail += " — " + j.errors.map((e) => e.message).join("; ");
      } catch (e) {}
      window.__SENDOFF_LAST_ERROR = detail;
      return false;
    }
    return true;
  } catch (e) {
    window.__SENDOFF_LAST_ERROR = (e && e.message) ? e.message : String(e);
    return false;
  }
}

/* ---------- Spin-Send clock ----------
   Mirrors gate/src/spins.js (SPIN_EPOCH / SPIN_CYCLE_MS). The server is the
   authority; these exist so a browser that cannot reach it still counts down
   to the same shared reset. Change both together. */
export const SPIN_EPOCH = Date.UTC(2026, 8, 9, 0, 0, 0);
export const SPIN_CYCLE_MS = 36 * 60 * 60 * 1000;
export const FREE_SPINS = 3;
export function spinCycle(now = Date.now()) {
  const index = Math.floor((now - SPIN_EPOCH) / SPIN_CYCLE_MS);
  return { index, resetsAt: SPIN_EPOCH + (index + 1) * SPIN_CYCLE_MS };
}
/* "12h 04m" style countdown; under a minute reads "any second". */
export function untilText(ts, now = Date.now()) {
  const ms = Math.max(0, ts - now);
  if (ms < 60_000) return "any second";
  const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}
