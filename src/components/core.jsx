import React, { useState } from "react";
import { m } from "motion/react";
import { T, slotStyle, crewLabel, FRIENDS, BUDGET_MIN, BUDGET_MAX, BUDGET_STEP, R, SH, SPRING } from "../theme.js";
import { CITIES, TRIPS } from "../data/trips.js";
import { fmt } from "../data/config.js";
import { priceTag } from "../data/pricing.js";

/* ---------- small components ---------- */

/* Every slot popover pops in on the same small spring. */
const popIn = {
  initial: { opacity: 0, y: 6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: SPRING,
};

export function Chip({ label, active, onClick }) {
  return (
    <m.button onClick={onClick} whileTap={{ scale: 0.96 }} transition={SPRING}
      style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700, fontSize: 14, padding: "8px 15px",
        borderRadius: R.pill, border: `2px solid ${T.ink}`, background: active ? T.ink : T.white,
        color: active ? T.paper : T.ink, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
      {label}
    </m.button>
  );
}

export function Slot({ value, display, options, format, onPick, open, setOpen, id }) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(open === id ? null : id); }} style={slotStyle}>
        {display || value}<span style={{ fontSize: "0.55em", verticalAlign: "middle", marginLeft: 3 }}>▾</span>
      </button>
      {open === id && (
        <m.span {...popIn} onClick={(e) => e.stopPropagation()}
          style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 30, display: "flex", gap: 6,
            background: T.white, border: `2px solid ${T.ink}`, borderRadius: 14, padding: 8, boxShadow: `4px 4px 0 ${T.shadow}` }}>
          {options.map((o) => (
            <button key={o} onClick={() => { onPick(o); setOpen(null); }}
              style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700, fontSize: 14, padding: "6px 10px",
                borderRadius: 8, border: "none", background: o === value ? T.sun : T.paper, cursor: "pointer", whiteSpace: "nowrap" }}>
              {format ? format(o) : o}
            </button>
          ))}
        </m.span>
      )}
    </span>
  );
}

export function OriginSlot({ origin, setOrigin, open, setOpen }) {
  const [draft, setDraft] = useState(origin);
  const commit = (v) => { const c = v.trim(); if (c) setOrigin(c); setOpen(null); };
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button onClick={(e) => { e.stopPropagation(); setDraft(origin); setOpen(open === "origin" ? null : "origin"); }} style={slotStyle}>
        {origin}<span style={{ fontSize: "0.55em", verticalAlign: "middle", marginLeft: 3 }}>▾</span>
      </button>
      {open === "origin" && (
        <m.span {...popIn} onClick={(e) => e.stopPropagation()}
          style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 30, background: T.white,
            border: `2px solid ${T.ink}`, borderRadius: 14, padding: 10, boxShadow: `4px 4px 0 ${T.shadow}`, width: 240 }}>
          <input autoFocus value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit(draft)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Type your city…"
            style={{ width: "100%", fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700, fontSize: 16,
              padding: "8px 10px", border: `2px solid ${T.ink}`, borderRadius: 10, background: T.paper }} />
          <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 8 }}>
            {Object.keys(CITIES)
              .filter((c) => c.toLowerCase().includes(draft.trim().toLowerCase()))
              .map((c) => (
                <button key={c} onClick={() => commit(c)}
                  style={{ display: "block", width: "100%", textAlign: "left", background: c === origin ? T.sun : "transparent",
                    border: "none", borderRadius: 9, padding: "8px 10px", fontFamily: "'Instrument Sans', sans-serif",
                    fontWeight: 700, fontSize: 14.5, cursor: "pointer", color: T.ink }}>
                  {c}
                </button>
              ))}
          </div>
          <button onClick={() => commit(draft)}
            style={{ marginTop: 8, width: "100%", background: T.cobalt, color: T.onCobalt, border: `2px solid ${T.ink}`,
              borderRadius: 10, padding: "7px", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            Set home base
          </button>
        </m.span>
      )}
    </span>
  );
}

/* Crew slot: solo through 7 friends, with 8+ handing off to The Big Send */
export function CrewSlot({ friends, setFriends, open, setOpen, goBigSend }) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(open === "f" ? null : "f"); }} style={slotStyle}>
        {crewLabel(friends)}<span style={{ fontSize: "0.55em", verticalAlign: "middle", marginLeft: 3 }}>▾</span>
      </button>
      {open === "f" && (
        <m.span {...popIn} onClick={(e) => e.stopPropagation()}
          style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 30, background: T.white,
            border: `2px solid ${T.ink}`, borderRadius: 14, padding: 8, boxShadow: `4px 4px 0 ${T.shadow}`,
            minWidth: 210, display: "block" }}>
          {FRIENDS.map((n) => (
            <button key={n} onClick={() => { setFriends(n); setOpen(null); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: friends === n ? T.sun : "transparent",
                border: "none", borderRadius: 9, padding: "9px 12px", fontFamily: "'Instrument Sans', sans-serif",
                fontWeight: 700, fontSize: 15, cursor: "pointer", color: T.ink }}>
              {n === 0 ? "Solo sendoff" : n === 1 ? "1 friend" : `${n} friends`}
            </button>
          ))}
          <div style={{ height: 2, background: T.ink, opacity: 0.12, margin: "6px 4px" }} />
          <button onClick={() => { setOpen(null); goBigSend(); }}
            style={{ display: "block", width: "100%", textAlign: "left", background: T.cobalt, color: T.onCobalt,
              border: "none", borderRadius: 9, padding: "10px 12px", fontFamily: "'Instrument Sans', sans-serif",
              fontWeight: 800, fontSize: 14.5, cursor: "pointer" }}>
            8+ of us 🎉 <span style={{ fontWeight: 600, opacity: 0.85 }}>→ The Big Send</span>
          </button>
        </m.span>
      )}
    </span>
  );
}

/* Budget slot: slider in $50 steps from $150 to $2,000 */
export function BudgetSlot({ budget, setBudget, open, setOpen }) {
  const nudge = (d) => setBudget(Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, budget + d)));
  const stepBtn = {
    width: 40, height: 40, borderRadius: 10, border: `2px solid ${T.ink}`, background: T.paper,
    fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 20, cursor: "pointer",
    color: T.ink, lineHeight: 1,
  };
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(open === "b" ? null : "b"); }} style={slotStyle}>
        {fmt(budget)}<span style={{ fontSize: "0.55em", verticalAlign: "middle", marginLeft: 3 }}>▾</span>
      </button>
      {open === "b" && (
        <m.span {...popIn} onClick={(e) => e.stopPropagation()}
          style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 30, background: T.white,
            border: `2px solid ${T.ink}`, borderRadius: 14, padding: 14, boxShadow: `4px 4px 0 ${T.shadow}`, width: 290 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <button onClick={() => nudge(-BUDGET_STEP)} style={stepBtn} aria-label="Less">−</button>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 26, color: T.cobalt }}>
              {fmt(budget)}
            </span>
            <button onClick={() => nudge(BUDGET_STEP)} style={stepBtn} aria-label="More">+</button>
          </div>
          <input type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={BUDGET_STEP} value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            style={{ width: "100%", marginTop: 12, accentColor: T.cobalt, cursor: "pointer" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, opacity: 0.55, marginTop: 2 }}>
            <span>{fmt(BUDGET_MIN)}</span><span>per person</span><span>{fmt(BUDGET_MAX)}</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            {[200, 500, 800, 1200, 2000].map((v) => (
              <button key={v} onClick={() => setBudget(v)}
                style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700, fontSize: 12.5,
                  padding: "5px 10px", borderRadius: 8, border: `2px solid ${T.ink}`,
                  background: budget === v ? T.sun : T.paper, cursor: "pointer" }}>
                {fmt(v)}
              </button>
            ))}
          </div>
        </m.span>
      )}
    </span>
  );
}

export function DateSlot({ value, min, placeholder, onChange }) {
  const label = value ? new Date(value + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : placeholder;
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span style={{ ...slotStyle, cursor: "pointer" }}>{label}</span>
      <input type="date" value={value} min={min} onChange={(e) => onChange(e.target.value)}
        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} />
    </span>
  );
}

/* The Sendoff logo — runway lifting into a paper plane */
export function Logo() {
  return (
    <svg viewBox="0 0 640 175" preserveAspectRatio="xMinYMid meet"
      style={{ height: "clamp(28px, 8vw, 42px)", width: "auto", maxWidth: "55vw", display: "block", flexShrink: 1 }}
      aria-label="Sendoff">
      <text x="16" y="122" fontFamily="'Bricolage Grotesque','Arial Black','Helvetica Neue',sans-serif"
        fontWeight="800" letterSpacing="-3" fontSize="92" fill={T.ink}>SENDOFF</text>
      <path d="M 20 148 L 400 148 Q 470 148 516 90" fill="none" stroke={T.sun}
        strokeWidth="8" strokeLinecap="round" strokeDasharray="2 18" />
      <g transform="translate(508,38) rotate(-24)">
        <path d="M 2 32 L 82 3 L 52 76 L 37 46 Z" fill={T.cobalt} stroke={T.ink} strokeWidth="5" strokeLinejoin="round" />
        <path d="M 2 32 L 82 3 L 40 40 Z" fill="#4A66F6" stroke={T.ink} strokeWidth="5" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function BudgetBar({ breakdown, total, days }) {
  const items = [["travel", "Getting there", T.cobalt], ["stay", "Sleeping", T.sun], ["food", "Eating", "#9BD3AE"], ["fun", "The fun part", T.poppy]];
  return (
    <div>
      <div style={{ display: "flex", height: 22, borderRadius: 999, overflow: "hidden", border: `2px solid ${T.ink}` }}>
        {items.map(([k, , c]) => <div key={k} style={{ width: `${(breakdown[k] / total) * 100}%`, background: c }} />)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 10 }}>
        {items.map(([k, label, c]) => (
          <span key={k} style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: c, border: `1.5px solid ${T.ink}`, display: "inline-block" }} />
            {label} {fmt(breakdown[k])}{k === "food" && days > 0 && breakdown.food > 0 ? ` (~${fmt(Math.round(breakdown.food / days / 5) * 5)}/day)` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/* TripCard v2 — straight grid, calm hover (transform only), photo-ready media
   block: when a trip gains a `photo` url the image replaces the emoji tile with
   zero further code changes. Entrance + filter reshuffles animate via motion. */
export const TripCard = React.forwardRef(function TripCard({ trip, i, mode, over, onOpen }, ref) {
  const badge = trip.cheapest
    ? { text: "CHEAPEST SEND", bg: T.ink, fg: T.sun }
    : trip.cost >= 1200 ? { text: "STRETCH GOAL", bg: T.poppy, fg: T.white } : null;
  return (
    <m.button ref={ref} onClick={() => onOpen(trip)}
      layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: over ? 0.85 : 1, y: 0 }}
      transition={{ ...SPRING, delay: Math.min(i % 6, 5) * 0.045 }}
      whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
      style={{ textAlign: "left", background: T.white, border: `2px solid ${T.ink}`, borderRadius: R.card,
        boxShadow: SH.card, cursor: "pointer", padding: 0, overflow: "hidden",
        fontFamily: "'Instrument Sans', sans-serif", color: T.ink, display: "flex", flexDirection: "column" }}>
      <div style={{ background: trip.color, borderBottom: `2px solid ${T.ink}`, position: "relative",
        aspectRatio: "5 / 3", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {trip.photo ? (
          <img src={trip.photo} alt="" loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 56, filter: "drop-shadow(0 3px 0 rgba(27,29,42,0.18))" }} aria-hidden="true">{trip.img}</span>
        )}
        <span style={{ position: "absolute", top: 10, right: 10, background: T.white, border: `2px solid ${T.ink}`,
          borderRadius: 10, padding: "5px 10px", textAlign: "center",
          fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15, lineHeight: 1 }}>
          {fmt(trip.cost)}<span style={{ fontSize: 9.5, fontWeight: 600, display: "block", marginTop: 2 }}>/person · {priceTag(trip)}</span>
        </span>
        {badge && (
          <span style={{ position: "absolute", bottom: 10, left: 12, background: badge.bg, color: badge.fg,
            border: `2px solid ${T.ink}`, borderRadius: R.pill, padding: "4px 10px", fontSize: 10.5,
            fontWeight: 800, letterSpacing: 0.4 }}>
            {badge.text}
          </span>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 20,
          lineHeight: 1.12, letterSpacing: "-0.3px" }}>{trip.name}</div>
        <div style={{ color: T.cobalt, fontWeight: 700, fontSize: 13 }}>{trip.tag}</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.68, marginTop: "auto", paddingTop: 6 }}>
          {trip.days} {trip.days === 1 ? "day" : "days"} · {mode}
        </div>
        {over && (
          <div style={{ fontSize: 12, fontWeight: 800, color: T.poppy }}>↑ above your current budget</div>
        )}
      </div>
    </m.button>
  );
});

/* ---------- WORLD PROGRESS BAR ---------- */
export function WorldProgress({ done, onOpenFirst }) {
  const total = TRIPS.length;
  const n = done.length;
  const pct = (n / total) * 100;
  const shown = pct === 0 ? "0" : pct < 1 ? pct.toFixed(1) : pct.toFixed(pct < 10 ? 1 : 0);
  const rank =
    n === 0 ? "Still on the couch" :
    n < 3 ? "Just getting started" :
    n < 8 ? "Certified sender" :
    n < 20 ? "Frequent flyer" :
    n < 50 ? "Serious traveler" : "Menace to the map";

  return (
    <section style={{ maxWidth: 960, margin: "20px auto 0", padding: "0 20px" }}>
      <div style={{ background: T.ink, color: T.paper, border: `2px solid ${T.ink}`, borderRadius: 20,
        boxShadow: `5px 5px 0 ${T.shadow}`, padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18 }}>
            YOUR WORLD, COMPLETED
          </div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 26, color: T.sun }}>
            {shown}%
          </div>
        </div>

        <div style={{ height: 16, background: "#2A2E45", border: `2px solid ${T.paper}33`, borderRadius: 999,
          marginTop: 12, overflow: "hidden" }}>
          <div style={{ width: `${Math.max(pct, n > 0 ? 2 : 0)}%`, height: "100%", background: "#2BA84A",
            borderRadius: 999, transition: "width .5s ease" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12.5, fontWeight: 700, flexWrap: "wrap", gap: 8 }}>
          <span style={{ opacity: 0.8 }}>{n} of {total} sends ticked off</span>
          <span style={{ color: T.sun }}>{rank}</span>
        </div>

        {n === 0 && (
          <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.65, marginTop: 12, lineHeight: 1.5 }}>
            Been somewhere already? Open the trip and hit "I did this trip ✅" — it turns green on the map.
          </div>
        )}
      </div>
    </section>
  );
}
