import React, { useEffect, useState } from "react";
import { T } from "../theme.js";
import { fmt } from "../data/config.js";

/* A fare for THIS route on THESE dates, from the gate's live lookup
   (/api/fare -> Travelpayouts cached search prices, round trip, per person).
   Honest by construction: it says whether the fare is for the exact dates or
   the cheapest seen that month, and it never renders a number it did not get.
   Absent dates, absent route, or a failed call render nothing at all. */
export default function LiveFare({ originCode, dest, dates }) {
  const [fare, setFare] = useState(null);
  const ready = /^[A-Z]{3}$/.test(originCode || "") && /^[A-Z]{3}$/.test(dest || "") && dates?.out && dates?.back;
  useEffect(() => {
    if (!ready) { setFare(null); return; }
    let on = true;
    setFare(null);
    const qs = new URLSearchParams({ origin: originCode, dest, out: dates.out, back: dates.back });
    fetch(`/api/fare?${qs}`).then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (on && j?.ok && Number(j.price) > 0) setFare(j); })
      .catch(() => {});
    return () => { on = false; };
  }, [ready, originCode, dest, dates?.out, dates?.back]);
  if (!fare) return null;
  const nice = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div style={{ background: "#EEF3FF", border: `2px solid ${T.ink}`, borderRadius: 12, padding: "10px 13px",
      fontSize: 13.5, fontWeight: 700, marginTop: 12 }}>
      ✈️ {fare.exact ? "Flights for your dates" : "Cheapest recent fare that month"}: {fmt(fare.price)} round trip per person
      {!fare.exact && fare.out && fare.back && (
        <span style={{ fontWeight: 600, opacity: 0.7 }}> · {nice(fare.out)} → {nice(fare.back)}</span>
      )}
      <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, marginTop: 3 }}>
        {fare.transfers === 0 ? "Nonstop. " : fare.transfers > 0 ? `${fare.transfers} stop${fare.transfers > 1 ? "s" : ""}. ` : ""}
        A recent search price, not a quote: the booking links below open the live search.
      </div>
    </div>
  );
}
