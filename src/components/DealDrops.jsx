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
export default function DealDrops({ origin, member, onOpenTrip, onJoin, showEmpty = false }) {
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
        if (!on || !j?.ok) return;
        /* An honest empty list beats the old sample deals: no drops = say so. */
        setLive((j.deals ?? []).map((d) => ({
          tripId: d.tripId, price: d.price, was: d.typical, live: true,
          expires: `${monthLabel(d.month)} departures`,
          note: `Lowest of ${d.n} fares seen on this route`,
        })));
      })
      .catch(() => {});
    return () => { on = false; };
  }, [origin]);

  const deals = (live ?? DEALS).filter((d) => TRIPS.some((x) => x.id === d.tripId));
  const shown = deals;
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
          Members see every drop from {origin} the moment it lands. $4.99/mo.
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
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.65, marginTop: 2 }}>Watch a send and we email you when its fare drops.</div>
      </div>
    </div>
  );

  /* Live answer, nothing on sale: say so on the Deals tab, show nothing elsewhere. */
  if (live && deals.length === 0) {
    if (!showEmpty) return null;
    return (
      <section className="sendoff-v3 mx-auto mt-5 max-w-[960px] px-5">
        <div className="flex items-baseline gap-2.5 font-display text-[22px] font-extrabold tracking-[-0.5px] text-foreground">
          DEAL DROPS 🔥
          <Badge className="rounded-full bg-foreground px-2.5 py-[3px] text-xs font-extrabold text-secondary">SENDOFF+</Badge>
        </div>
        <div style={{ marginTop: 10, background: T.white, border: `2px solid ${T.ink}`, borderRadius: 14, padding: "14px 16px",
          fontFamily: "'Instrument Sans', sans-serif", fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>
          No drops from {origin} right now. The next fare refresh is within the hour; a drop shows up here the moment a route goes well under its usual price.
          {member ? " Watch a send from the trips tab and we email you when it drops." : " Sendoff+ members get the email the moment it happens."}
        </div>
      </section>
    );
  }

  /* Not a member: the drops are there but blurred, with the unlock on top,
     the same treatment as locked trip cards. */
  if (!member) {
    return (
      <section className="sendoff-v3 mx-auto mt-2.5 max-w-[960px] px-5">
        <div className="flex items-baseline gap-2.5 font-display text-[22px] font-extrabold tracking-[-0.5px] text-foreground">
          DEAL DROPS 🔥
          <Badge className="rounded-full bg-foreground px-2.5 py-[3px] text-xs font-extrabold text-secondary">SENDOFF+</Badge>
        </div>
        <div style={{ position: "relative", marginTop: 10 }}>
          <div style={{ filter: "blur(8px)", pointerEvents: "none", userSelect: "none" }} aria-hidden="true">
            <ExperienceSection title={null} items={items} onSelect={() => {}}
              cardClassName="rounded-2xl border-2 border-border shadow-[4px_4px_0_var(--border)]" />
          </div>
          <button onClick={onJoin} type="button"
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer" }}>
            <span style={{ background: T.ink, color: T.paper, border: `2px solid ${T.ink}`, borderRadius: 18, padding: "18px 22px", maxWidth: 340, textAlign: "center",
              boxShadow: `5px 5px 0 ${T.cobalt}`, fontFamily: "'Instrument Sans', sans-serif" }}>
              <span style={{ display: "block", fontSize: 26 }}>🔒</span>
              <span style={{ display: "block", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, marginTop: 6 }}>
                {deals.length} {deals.length === 1 ? "drop" : "drops"} live from {origin}
              </span>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, opacity: 0.8, marginTop: 4 }}>Members see every drop the moment it lands, and get the email.</span>
              <span style={{ display: "inline-block", marginTop: 12, background: T.sun, color: T.ink, borderRadius: 10, padding: "9px 14px",
                fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 14 }}>Unlock Sendoff+ · $4.99/mo →</span>
            </span>
          </button>
        </div>
      </section>
    );
  }

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
