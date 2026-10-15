import React from "react";
import { m } from "motion/react";
import { T, SH, SPRING } from "../theme.js";
import { buildStayUrl, defaultStayDates } from "../utils/stayLink.js";

/* "Where your crew stays" — one group-sized lodging search link per trip,
   through our Travelpayouts account (Hotellook -> Booking.com program).
   City-level search, dates + guest count pre-filled; no hand-picked hotels. */
export default function StayBlock({ trip, friends, dates }) {
  const crew = Math.max(1, friends || 1);
  const url = buildStayUrl(trip, crew, dates);
  if (!url) return null;
  const hasDates = dates?.out && dates?.back;
  const when = hasDates ? dates : defaultStayDates(trip);
  const anchorCity = new URL(url).searchParams.get("destination").split(",")[0];
  return (
    <>
      <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, color: T.cobalt,
        textTransform: "uppercase", margin: "26px 0 10px" }}>
        Where your crew stays
      </div>
      <m.a href={url} target="_blank" rel="noopener noreferrer"
        whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={SPRING}
        style={{ background: T.sun, color: T.onAccent, border: `2px solid ${T.ink}`,
          borderRadius: 14, boxShadow: SH.card, padding: "12px 13px", textDecoration: "none", display: "block" }}>
        <span style={{ fontSize: 20 }}>🛏️</span>
        <span style={{ display: "block", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15, marginTop: 4 }}>
          Group stays in {anchorCity} ↗
        </span>
        <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, opacity: 0.85, marginTop: 2 }}>
          {crew} {crew === 1 ? "guest" : "guests"} · {when.out} → {when.back}
          {hasDates ? "" : " (sample dates — set yours up top)"} · rooms that fit everyone
        </span>
      </m.a>
    </>
  );
}
