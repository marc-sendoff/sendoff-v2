import { STAY_ANCHOR } from "../data/stays.js";

/* Group-lodging search links through our Travelpayouts account.
   search.hotellook.com resolves the query, mints a TP click (marker below)
   and hands off to the Booking.com program inside Travelpayouts — verified
   live 2026-08-30: a browser lands on sp.booking.com results with our
   affnetTP click label, city, dates and guest count all carried.
   761... is the marker every live tpk.lv shortlink actually attributes to;
   AFF.travelpayouts ("561612") is a stale placeholder — do not swap back. */
const STAY_MARKER = "763771";

/* No dates picked: send them 6 weeks out (the flights lane's 5-to-8-week
   sweet spot) for the trip's own duration, so results show real prices
   instead of tonight's. */
export function defaultStayDates(trip, now = new Date()) {
  const day = 24 * 60 * 60 * 1000;
  const start = new Date(now.getTime() + 42 * day);
  const end = new Date(start.getTime() + Math.max(1, trip.days || 2) * day);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { out: iso(start), back: iso(end) };
}

export function buildStayUrl(trip, crewSize, dates) {
  const anchor = STAY_ANCHOR[trip.id] || trip.city || trip.stayName;
  if (!anchor) return null;
  const when = dates?.out && dates?.back ? dates : defaultStayDates(trip);
  const u = new URL("https://search.hotellook.com/hotels");
  u.searchParams.set("destination", anchor);
  u.searchParams.set("checkIn", when.out);
  u.searchParams.set("checkOut", when.back);
  u.searchParams.set("adults", String(Math.min(Math.max(crewSize || 1, 1), 16)));
  u.searchParams.set("language", "en");
  u.searchParams.set("currency", "usd");
  u.searchParams.set("marker", STAY_MARKER);
  return u.toString();
}
