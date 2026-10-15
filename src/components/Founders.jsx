import React, { useEffect, useState } from "react";
import { m } from "motion/react";
import { T, R, SH, SPRING, THEMES } from "../theme.js";

/* ---------- FOUNDERS CLUB ----------
   Ten seats, yearly members only, first come first served. The seat count
   and the names come from /api/founders; everything else is the pitch. */
export function useFounders() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let on = true;
    fetch("/api/founders").then((r) => (r.ok ? r.json() : null)).then((j) => { if (on && j?.ok) setData(j); }).catch(() => {});
    return () => { on = false; };
  }, []);
  return data;
}

export function SeatCounter({ data, style }) {
  if (!data) return null;
  const sold = data.left === 0;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: sold ? T.ink : T.sun, color: sold ? T.sun : T.ink,
      border: `2px solid ${T.ink}`, borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 800, ...style }}>
      ✦ {sold ? "Founders Club is full" : `${data.left} of ${data.seats} Founder seats left`}
    </div>
  );
}

const PERKS = [
  ["✦", "A numbered seat, for life", "Founder #1 to #10 on your profile. Cancel in year three and it's still yours."],
  ["📦", "The spring box", "A Sendoff hat, stickers and a handwritten card, shipped to you in spring."],
  ["🎨", "Your own look", "Founders can switch the whole app to Founders Black or Cobalt. Everyone else gets paper."],
  ["⚡", "First look", "Every new send lands in your inbox a day before it goes on the site."],
  ["📝", "Your name on the wall", "First name and city, right here, in the order you joined."],
  ["💬", "A direct line", "Reply to any email and it's Marc. Not a form, not a bot."],
];

export default function Founders({ acct, onJoin }) {
  const data = useFounders();
  const isFounder = acct?.membership?.plan === "founder";
  const mine = acct?.membership?.founder_number;
  return (
    <section style={{ maxWidth: 680, margin: "0 auto", padding: "26px 20px 44px" }}>
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, color: T.cobalt, textTransform: "uppercase" }}>
          Founders Club · 10 seats
        </div>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 6.5vw, 44px)",
          lineHeight: 1.15, letterSpacing: "-0.8px", marginTop: 10 }}>
          The first ten people<br />
          <span style={{ color: T.cobalt, borderBottom: `6px solid ${T.sun}` }}>to go yearly.</span>
        </div>
        <p style={{ marginTop: 16, fontSize: 16, fontWeight: 600, lineHeight: 1.6, opacity: 0.85, maxWidth: 560 }}>
          Sendoff+ is $40 a year. The first ten people who pay for a year aren't just members, they're
          Founders: a numbered seat, a box in the spring, their own look for the app, and their name on this page.
          Nothing extra to pay. When the ten seats are gone, they're gone.
        </p>
        <div style={{ marginTop: 14 }}><SeatCounter data={data} /></div>
      </m.div>

      {isFounder ? (
        <div style={{ marginTop: 24, background: T.ink, color: T.onInk, borderRadius: 20, padding: "20px 22px", border: `2px solid ${T.ink}`, boxShadow: SH.big }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 24 }}>You're Founder #{mine}.</div>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.85, marginTop: 6 }}>Pick your look from your profile card (tap your initial, top right).</div>
        </div>
      ) : (
        <m.button onClick={onJoin} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={SPRING}
          style={{ width: "100%", marginTop: 24, background: T.cobalt, color: T.white, border: `2px solid ${T.ink}`,
            borderRadius: R.card, boxShadow: SH.card, padding: "16px", fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800, fontSize: 17, cursor: "pointer" }}>
          {data?.left === 0 ? "Get Sendoff+ yearly · $40" : "Take a seat · $40 a year →"}
        </m.button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 28 }}>
        {PERKS.map(([e, title, sub]) => (
          <div key={title} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: T.white, border: `2px solid ${T.ink}`,
            borderRadius: 14, padding: "14px 16px", boxShadow: SH.card }}>
            <span style={{ fontSize: 22, lineHeight: 1.1 }}>{e}</span>
            <div>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15.5 }}>{title}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.72, marginTop: 3, lineHeight: 1.45 }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* the three looks, as swatches */}
      <div style={{ marginTop: 28, fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, color: T.cobalt, textTransform: "uppercase" }}>The three looks</div>
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        {Object.entries(THEMES).map(([id, th]) => (
          <div key={id} style={{ flex: 1, background: th.paper, color: th.ink, border: `2px solid ${T.ink}`, borderRadius: 14, padding: "14px 12px", boxShadow: SH.card }}>
            <div style={{ height: 10, borderRadius: 999, background: th.cobalt, marginBottom: 8 }} />
            <div style={{ height: 10, borderRadius: 999, background: th.sun, width: "60%", marginBottom: 12 }} />
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 13 }}>{th.label}</div>
          </div>
        ))}
      </div>

      {/* the wall */}
      <div style={{ marginTop: 28, fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, color: T.cobalt, textTransform: "uppercase" }}>The ten</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 10 }}>
        {Array.from({ length: data?.seats || 10 }, (_, i) => {
          const f = data?.founders?.find((x) => x.number === i + 1);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: f ? T.ink : T.white, color: f ? T.sun : T.ink,
              border: `2px solid ${T.ink}`, borderRadius: 12, padding: "10px 12px", opacity: f ? 1 : 0.55 }}>
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15, width: 34 }}>#{i + 1}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f ? `${f.name}${f.city ? " · " + f.city : ""}` : "open"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
