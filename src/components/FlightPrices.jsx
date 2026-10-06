import React from "react";
import { m } from "motion/react";
import { T, SH, SPRING } from "../theme.js";
import { buildGoogleFlightsUrl } from "../utils/flightLink.js";

/* "Live flight prices for your crew" — one tap into Google Flights with the
   route, dates, and seat count pre-filled. Google is the free pricing
   backend; the Travelpayouts booking tiles above stay the revenue path. */
export default function FlightPrices({ trip, origin, friends, dates }) {
  const url = buildGoogleFlightsUrl(trip, origin, friends, dates);
  if (!url) return null;
  const dated = dates && dates.out && dates.back;
  return (
    <m.a href={url} target="_blank" rel="noopener noreferrer"
      whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={SPRING}
      style={{ display: "block", marginTop: 10, background: T.white, color: T.ink,
        border: `2px solid ${T.ink}`, borderRadius: 14, boxShadow: SH.card,
        padding: "12px 14px", textDecoration: "none" }}>
      <span style={{ fontSize: 20 }}>🛫</span>
      <span style={{ display: "block", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15, marginTop: 4 }}>
        Live flight prices for your crew ↗
      </span>
      <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, opacity: 0.85, marginTop: 2 }}>
        Google Flights · {friends || 1} {(friends || 1) === 1 ? "seat" : "seats"} · {dated ? "your dates" : "a weekend ~6 weeks out"}
      </span>
    </m.a>
  );
}
