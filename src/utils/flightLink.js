// Google Flights deep link: a free, live-priced results page for the whole
// crew. The q= free-text form ("Flights to X from Y on D through D for N
// passengers") lands on populated results priced for all N seats — verified
// working tech, and unlike tfs= it needs no protobuf encoding.
//
// Destination is the trip's IATA code and origin the metro/airport code when
// we have one: live validation showed codes parse 5/5 (metro origins like NYC
// correctly expand to every area airport) while place names can silently
// misparse ("Tokyo, Japan" → generic homepage) or resolve to unpriceable
// POIs. Free-text origin stays as the fallback for cities off our list.
import { AIRPORTS } from "../data/cities.js";

/* Default travel window when the user hasn't picked dates: ~6 weeks out,
   nudged to the next Friday (crew trips anchor on weekends), which keeps the
   departure inside a 5-8 week horizon. Return follows the trip's own length —
   `days` is inclusive of both travel days (matches App.jsx's tripDays math),
   so a 4-day send comes back out+3. */
export function defaultDates(tripDays, now = new Date()) {
  const out = new Date(now.getTime());
  out.setDate(out.getDate() + 42);
  out.setDate(out.getDate() + ((5 - out.getDay() + 7) % 7)); // advance to Friday
  const nights = Math.max(1, (tripDays || 7) - 1);
  const back = new Date(out.getTime());
  back.setDate(back.getDate() + nights);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { out: iso(out), back: iso(back) };
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

// Google's q= parser chokes on diacritics ("Cancún" silently serves the
// generic homepage; plain "Cancun" prices fine — verified live).
const ascii = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function buildGoogleFlightsUrl(trip, originCity, crewSize, dates) {
  // No airport, no button: drive-only trips (no `fly` code) resolve to POI
  // destinations Google can't price ("No options matching your search").
  if (!trip.fly) return null;
  const dest = trip.fly;
  const origin = AIRPORTS[originCity] || ascii((originCity || "").trim());
  if (!origin) return null;
  const chosen =
    dates && ISO_RE.test(dates.out || "") && ISO_RE.test(dates.back || "")
      ? dates
      : defaultDates(trip.days);
  const n = Math.max(1, Math.min(9, Math.round(crewSize) || 1));
  const q =
    `Flights to ${dest} from ${origin} on ${chosen.out} through ${chosen.back}` +
    ` for ${n} ${n === 1 ? "passenger" : "passengers"}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
}
