import React from "react";
import { T } from "../theme.js";
import { TRIPS, AIRPORTS } from "../data/trips.js";
import { fmt, DEALS } from "../data/config.js";
import { ExperienceSection } from "@/components/kokonutui/carousel-cards";
import { Badge } from "@/components/ui/badge";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (ym) => MONTHS[Number(String(ym).slice(5, 7)) - 1] ?? "";

/* Deal Drops v3 — same gating and copy as v2; the strip itself is the
   published Kokonut carousel-cards section (snap scroll, chevron nav, photo
   cards). The lock/member tiles ride in the same row as trailing cards.
   DATA: live deals from /api/deals for this origin (routes priced well under
   their own typical fare in the nightly pull). Until the pull covers an
   origin, the sample deals in config.js stand in, exactly as before. */
export default function DealDrops({ origin, member, onOpenTrip, onJoin }) {
  const code = AIRPORTS[origin] || origin.slice(0, 3).toUpperCase();
  const [live, setLive] = React.useState(null);
  React.useEffect(() => {
    let on = true;
    setLive(null);
    const c = AIRPORTS[origin];
    if (!c) return undefined;
    fetch(`/api/deals?origin=${c}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!on || !j?.ok || !j.deals?.length) return;
        setLive(j.deals.map((d) => ({
          tripId: d.tripId, price: d.price, was: d.typical, live: true,
          expires: `${monthLabel(d.month)} departures`,
          note: `Lowest of ${d.n} fares seen on this route`,
        })));
      })
      .catch(() => {});
    return () => { on = false; };
  }, [origin]);

  const deals = (live ?? DEALS).filter((d) => TRIPS.some((x) => x.id === d.tripId));
  const shown = member ? deals : deals.slice(0, 1);
  const hidden = Math.max(deals.length - 1, 0);

  const items = shown.map((d) => {
    const t = TRIPS.find((x) => x.id === d.tripId);
    return {
      id: d.tripId,
      trip: t,
      image: t.photo,
      emoji: t.img,
      tileColor: t.color,
      title: `${code} → ${t.name.split(",")[0]}`,
      location: t.tag,
      date: d.note,
      badge: `−${Math.round((1 - d.price / d.was) * 100)}% · ${d.expires}${d.live ? "" : " left"}`,
      price: `${fmt(d.price)} RT`,
      oldPrice: fmt(d.was),
    };
  });

  const trailing = !member ? (
    <div className="w-[240px] flex-none snap-start">
      <button onClick={onJoin} type="button"
        className="block h-[320px] w-full cursor-pointer rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        style={{ background: T.ink, color: T.paper, border: `2px solid ${T.ink}`,
          boxShadow: `4px 4px 0 ${T.cobalt}`, padding: "14px 16px", fontFamily: "'Instrument Sans', sans-serif" }}>
        <div style={{ fontSize: 22 }}>🔒</div>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16, marginTop: 6 }}>
          {hidden} more deals live right now
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.75, marginTop: 3 }}>
          Members get texted the moment fares from {origin} drop. $3.99/mo.
        </div>
        <div style={{ marginTop: 10, background: T.sun, color: T.onAccent, borderRadius: 10, padding: "8px 12px",
          fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 13, display: "inline-block" }}>
          Unlock Sendoff+ →
        </div>
      </button>
    </div>
  ) : (
    <div className="w-[200px] flex-none snap-start">
      <div className="h-[320px]"
        style={{ background: T.tint, border: `2px solid ${T.ink}`, borderRadius: 12,
          padding: "14px 16px", fontFamily: "'Instrument Sans', sans-serif", display: "flex",
          flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 20 }}>✅</div>
        <div style={{ fontWeight: 800, fontSize: 14, marginTop: 6 }}>Alerts ON for {origin}</div>
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.65, marginTop: 2 }}>You'll get texted when fares drop.</div>
      </div>
    </div>
  );

  return (
    <section className="sendoff-v3 mx-auto mt-2.5 max-w-[960px] px-5">
      <ExperienceSection
        title={
          <span className="flex items-baseline gap-2.5 font-display text-[22px] font-extrabold tracking-[-0.5px] text-foreground">
            DEAL DROPS 🔥
            <Badge className="rounded-full bg-foreground px-2.5 py-[3px] text-xs font-extrabold text-secondary">SENDOFF+</Badge>
          </span>
        }
        items={items}
        onSelect={(item) => onOpenTrip(item.trip)}
        /* one design language per row: the published card, skinned to the
           brand frame so it agrees with the ink CTA tile beside it */
        cardClassName="rounded-2xl border-2 border-border shadow-[4px_4px_0_var(--border)]"
        trailing={trailing} />
    </section>
  );
}
