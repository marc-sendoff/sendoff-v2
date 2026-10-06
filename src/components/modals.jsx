import React, { useState, useEffect } from "react";
import { m } from "motion/react";
import { T, R, SH, SPRING } from "../theme.js";
import { TRIPS } from "../data/trips.js";
import { STRIPE, PLUS_PERKS, fmt, modeLabel, bookLinks, shareText, sendRequest, originBreakdown } from "../data/config.js";
import LiveFare from "./LiveFare.jsx";
import { AIRPORTS } from "../data/trips.js";
import StayBlock from "./StayBlock.jsx";
import { BudgetBar } from "./core.jsx";
import FlightPrices from "./FlightPrices.jsx";

/* "2026-10" -> "October". Fare months come from the nightly pull. */
function monthLabel(ym) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(ym));
  if (!m) return "";
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 15)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
}

/* Section label used across the detail sheet — one voice for every heading. */
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, color: T.cobalt,
      textTransform: "uppercase", margin: "26px 0 10px" }}>
      {children}
    </div>
  );
}

/* Shared centered-modal shell: fading backdrop + spring pop-in panel. Every
   centered modal uses this; the Detail sheet keeps its bottom-sheet variant. */
function ModalShell({ onClose, maxWidth, zIndex = 60, children }) {
  return (
    <m.div onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}
      style={{ position: "fixed", inset: 0, background: "rgba(27,29,42,0.58)", zIndex, display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16 }}>
      <m.div onClick={(e) => e.stopPropagation()} initial={{ y: 18, scale: 0.97, opacity: 0.7 }}
        animate={{ y: 0, scale: 1, opacity: 1 }} transition={SPRING}
        style={{ background: T.paper, border: `2px solid ${T.ink}`, borderRadius: 22, boxShadow: SH.big,
          width: "100%", maxWidth, maxHeight: "90vh", overflowY: "auto",
          fontFamily: "'Instrument Sans', sans-serif", color: T.ink }}>
        {children}
      </m.div>
    </m.div>
  );
}

/* ---------- Send Points ----------
   Earned by booking what Spin-Send picked; the gate service keeps the ledger.
   Renders nothing when the service can't be reached (no session, staging
   without the API), so the profile never shows a zero it cannot vouch for. */
function SendPoints() {
  const [board, setBoard] = useState(null);
  useEffect(() => {
    let on = true;
    fetch("/api/leaderboard", { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => { if (on && b?.ok) setBoard(b); })
      .catch(() => {});
    return () => { on = false; };
  }, []);
  if (!board) return null;
  return (
    <>
      <SectionLabel>Send Points</SectionLabel>
      <div style={{ background: T.ink, color: T.paper, borderRadius: 14, padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 24, color: T.sun }}>
            {board.me.points.toLocaleString()} <span style={{ fontSize: 13, color: T.paper, opacity: 0.8 }}>pts</span>
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.75 }}>
            {board.me.rank ? `#${board.me.rank} of ${board.total}` : `Spin, then book the pick: +${board.bonus} each`}
          </div>
        </div>
        <span style={{ fontSize: 26 }}>🎡</span>
      </div>
      {board.top.length > 0 && (
        <div style={{ marginTop: 8, background: T.white, border: `2px solid ${T.ink}`, borderRadius: 13, overflow: "hidden" }}>
          {board.top.slice(0, 5).map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 13px",
              borderTop: i ? `1px solid rgba(27,29,42,0.12)` : "none", background: r.you ? "#FFF4CC" : "transparent",
              fontSize: 13, fontWeight: r.you ? 800 : 600 }}>
              <span style={{ width: 22, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, opacity: 0.6 }}>{i + 1}</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}{r.you ? " (you)" : ""}</span>
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800 }}>{r.points.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- Sendoff+ membership ---------- */

export function PlusModal({ origin, onJoin, onClose }) {
  const [plan, setPlan] = useState("mo");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeName, setCodeName] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const tryCode = async () => {
    /* the code lives server-side only (gate service /api/plus-code) — the
       bundle carries no secret and wrong guesses are throttled per IP */
    try {
      const r = await fetch("/api/plus-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) { setCodeErr(""); onJoin(codeName.trim()); }
      /* a throttled visitor typing the RIGHT code must not be told it's wrong */
      else if (r.status === 429) setCodeErr("Too many tries — wait a few minutes, then try again.");
      /* 503 = no code configured server-side — not the visitor's fault */
      else if (r.status === 503) setCodeErr("Codes aren't working right now — try again later.");
      else setCodeErr("That code isn't right — check it and try again.");
    } catch {
      setCodeErr("Couldn't check the code — try again in a moment.");
    }
  };
  const codeBad = codeErr !== "";
  const [state, setState] = useState("idle"); // idle | sending | done | failed
  const live = STRIPE.monthly || STRIPE.yearly;
  const isCollege = /\.edu(\.[a-z]{2,})?$|\.ac\.[a-z]{2,}$/i.test(email.trim());
  const notify = async () => {
    if (!email.includes("@")) return;
    setState("sending");
    const ok = await sendRequest("Sendoff+ Waitlist", {
      name: codeName.trim() || "(not given)",
      email, city: origin, interested_plan: plan === "yr" ? "Yearly $34.99" : "Monthly $3.99",
      college_email: isCollege ? "YES — first month free" : "no",
    });
    setState(ok ? "done" : "failed");
  };
  return (
    <ModalShell onClose={onClose} maxWidth={420} zIndex={120}>
        <div style={{ background: T.ink, color: T.paper, padding: "22px 22px 18px", borderRadius: "20px 20px 0 0", position: "relative" }}>
          <m.button onClick={onClose} whileTap={{ scale: 0.92 }} transition={SPRING} aria-label="Close"
            style={{ position: "absolute", top: 14, right: 14, width: 32, height: 32, borderRadius: "50%",
              border: `2px solid ${T.paper}`, background: "transparent", color: T.paper, fontWeight: 800, cursor: "pointer" }}>✕</m.button>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 28 }}>
            SENDOFF<span style={{ color: T.sun }}>+</span>
            {!(STRIPE.monthly || STRIPE.yearly) && (
              <span style={{ fontSize: 11, fontWeight: 800, background: T.sun, color: T.ink,
                borderRadius: 999, padding: "4px 10px", marginLeft: 10, verticalAlign: "middle", letterSpacing: 1 }}>
                COMING SOON
              </span>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.85, marginTop: 4 }}>
            The deals find you. Priced for broke legends.
          </div>
        </div>
        <div style={{ padding: "18px 22px 24px" }}>
          {PLUS_PERKS.map(([e, title, sub]) => (
            <div key={title} style={{ display: "flex", gap: 12, padding: "9px 0", alignItems: "flex-start" }}>
              <span style={{ fontSize: 20 }}>{e}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>{title}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.65 }}>
                  {title === "Instant deal alerts" ? `Texted the second a cheap flight leaves ${origin}` : sub}
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            {[["mo", "$3.99", "/month"], ["yr", "$34.99", "/year · save 27%"]].map(([id, price, per]) => (
              <m.button key={id} onClick={() => setPlan(id)} whileTap={{ scale: 0.97 }} transition={SPRING}
                style={{ flex: 1, background: plan === id ? T.sun : T.white, border: `2px solid ${T.ink}`,
                  borderRadius: 14, boxShadow: plan === id ? SH.card : "none", padding: "12px 8px",
                  cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif", color: T.ink }}>
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 20 }}>{price}</div>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>{per}</div>
              </m.button>
            ))}
          </div>
          {live ? (
            <>
              <button onClick={() => window.open(plan === "yr" ? STRIPE.yearly : STRIPE.monthly, "_blank", "noopener")}
                style={{ width: "100%", marginTop: 14, background: T.cobalt, color: T.white, border: `2px solid ${T.ink}`,
                  borderRadius: 14, boxShadow: `4px 4px 0 ${T.ink}`, padding: "14px",
                  fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
                Start my free week →
              </button>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.5, marginTop: 8, textAlign: "center" }}>
                Secure checkout by Stripe · cancel anytime
              </div>
            </>
          ) : state === "done" ? (
            <div style={{ marginTop: 16, background: "#E8F5EC", border: `2px solid ${T.ink}`, borderRadius: 14,
              padding: "16px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 26 }}>🛫</div>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 17, marginTop: 4 }}>
                You're on the list!
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.75, marginTop: 4 }}>
                {isCollege
                  ? "We'll email you the moment Sendoff+ drops — with your free first month attached. 🎓"
                  : "We'll email you the moment Sendoff+ drops — with founder pricing locked in."}
              </div>
            </div>
          ) : (
            <>
              <input value={codeName} onChange={(e) => setCodeName(e.target.value)}
                placeholder="your name"
                style={{ width: "100%", marginTop: 16, fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600,
                  fontSize: 16, padding: "13px 14px", border: `2px solid ${T.ink}`, borderRadius: 12, background: T.white, color: T.ink }} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && notify()}
                placeholder="your email"
                style={{ width: "100%", marginTop: 8, fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600,
                  fontSize: 16, padding: "13px 14px", border: `2px solid ${T.ink}`, borderRadius: 12, background: T.white, color: T.ink }} />
              <button onClick={notify} disabled={state === "sending" || !email.includes("@")}
                style={{ width: "100%", marginTop: 10, background: email.includes("@") ? T.cobalt : "#B9C0D9",
                  color: T.white, border: `2px solid ${T.ink}`, borderRadius: 14,
                  boxShadow: email.includes("@") ? `4px 4px 0 ${T.ink}` : "none", padding: "14px",
                  fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16,
                  cursor: email.includes("@") ? "pointer" : "not-allowed" }}>
                {state === "sending" ? "Sending…" : "Notify me when it drops →"}
              </button>
              {isCollege && (
                <div style={{ marginTop: 8, background: T.sun, border: `2px solid ${T.ink}`, borderRadius: 10,
                  padding: "8px 12px", fontSize: 12.5, fontWeight: 800 }}>
                  🎓 College email spotted — your first month is on us.
                </div>
              )}
              <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.55, marginTop: 8, textAlign: "center" }}>
                {state === "failed"
                  ? "Couldn't send — try again in a moment."
                  : "🎓 Sign up with a college email = first month free."}
              </div>

              {/* access code unlock */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 12px" }}>
                <div style={{ flex: 1, height: 2, background: T.ink, opacity: 0.15 }} />
                <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.5, letterSpacing: 1 }}>OR</span>
                <div style={{ flex: 1, height: 2, background: T.ink, opacity: 0.15 }} />
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, color: T.cobalt,
                textTransform: "uppercase", marginBottom: 8 }}>
                Unlock Sendoff+ with an access code
              </div>
              <input value={codeName} onChange={(e) => setCodeName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && tryCode()}
                placeholder="Your name"
                style={{ width: "100%", marginBottom: 8, fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600,
                  fontSize: 16, padding: "12px 14px", border: `2px solid ${T.ink}`, borderRadius: 12,
                  background: T.white, color: T.ink }} />
              <div style={{ display: "flex", gap: 8 }}>
                <input value={code} onChange={(e) => { setCode(e.target.value); setCodeErr(""); }}
                  onKeyDown={(e) => e.key === "Enter" && tryCode()}
                  placeholder="Access code"
                  style={{ flex: 1, fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700, fontSize: 16,
                    padding: "12px 14px", border: `2px solid ${codeBad ? T.poppy : T.ink}`, borderRadius: 12,
                    background: T.white, color: T.ink, letterSpacing: 2 }} />
                <button onClick={tryCode}
                  style={{ background: T.sun, border: `2px solid ${T.ink}`, borderRadius: 12, padding: "0 18px",
                    fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15,
                    cursor: "pointer", color: T.ink, boxShadow: `3px 3px 0 ${T.ink}` }}>
                  Unlock
                </button>
              </div>
              {codeBad && (
                <div style={{ fontSize: 12, fontWeight: 700, color: T.poppy, marginTop: 7 }}>
                  {codeErr}
                </div>
              )}
            </>
          )}
        </div>
    </ModalShell>
  );
}

/* ---------- detail + share ---------- */

export function Detail({ trip, origin, originCoords, friends, dates, member, isDone, onMarkDone, onJoin, onClose, wheelBonus = 0, onBook }) {
  const adj = originBreakdown(trip, originCoords, friends);
  const links = bookLinks(trip, origin, originCoords, friends, dates);
  const [shared, setShared] = useState(false);
  /* Send Points for booking the wheel's pick: "offered" until the first
     booking search opens, then whatever the server actually banked. */
  const [banked, setBanked] = useState(null);
  const bookClick = () => {
    if (!wheelBonus || banked !== null || !onBook) return;
    setBanked(0); // claim in flight: a second tab must not claim twice
    Promise.resolve(onBook(trip)).then((pts) => setBanked(pts || 0));
  };
  const doShare = async () => {
    const text = shareText(trip, origin, originCoords, friends, dates);
    try {
      if (navigator.share) { await navigator.share({ text }); setShared(true); return; }
      throw new Error("no native share");
    } catch (err) {
      try { await navigator.clipboard.writeText(text); setShared(true); }
      catch (e2) {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta); setShared(true);
      }
    }
    setTimeout(() => setShared(false), 2500);
  };
  return (
    <m.div onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}
      style={{ position: "fixed", inset: 0, background: "rgba(27,29,42,0.55)", zIndex: 100, display: "flex",
        alignItems: "flex-end", justifyContent: "center", padding: "40px 12px 0" }}>
      <m.div onClick={(e) => e.stopPropagation()} initial={{ y: 48, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }}
        transition={SPRING}
        style={{ background: T.paper, border: `2px solid ${T.ink}`, borderBottom: "none", borderRadius: "22px 22px 0 0",
          maxWidth: 560, width: "100%", maxHeight: "88vh", overflowY: "auto", fontFamily: "'Instrument Sans', sans-serif", color: T.ink }}>
        {/* header — photo-ready: a trip.photo renders as the hero with a legibility
            wash; until then the brand color block carries the emoji */}
        <div style={{ background: trip.color, borderBottom: `2px solid ${T.ink}`, padding: trip.photo ? 0 : "20px 22px",
          position: "relative", borderRadius: "20px 20px 0 0", overflow: "hidden" }}>
          {trip.photo && (
            <img src={trip.photo} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          <div style={trip.photo
            ? { position: "relative", padding: "72px 22px 20px", color: T.white,
                background: "linear-gradient(180deg, rgba(27,29,42,0) 20%, rgba(27,29,42,0.72) 78%)" }
            : {}}>
            {!trip.photo && <div style={{ fontSize: 40 }} aria-hidden="true">{trip.img}</div>}
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 30,
              lineHeight: 1.05, marginTop: 6, letterSpacing: "-0.5px" }}>{trip.name}</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{trip.tag}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6, opacity: 0.85 }}>
              {trip.days} days · {modeLabel(trip, originCoords)} · from {origin}
            </div>
          </div>
          <m.button onClick={onClose} whileTap={{ scale: 0.92 }} transition={SPRING} aria-label="Close"
            style={{ position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: "50%",
              border: `2px solid ${T.ink}`, background: T.white, color: T.ink, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>✕</m.button>
        </div>
        <div style={{ padding: "20px 22px 30px" }}>
          <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0, fontWeight: 500 }}>{trip.blurb}</p>
          <SectionLabel>Where the {fmt(adj.total)} goes</SectionLabel>
          {/* which price system produced this number: the one honest line */}
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.62, margin: "-4px 0 10px", lineHeight: 1.45 }}>
            {trip.priceSource === "live"
              ? `✈️ Flights are a live fare from ${origin}${trip.fareMonth ? ` for ${monthLabel(trip.fareMonth)}` : ""}, refreshed nightly`
              : "Estimate: no live fare for this route from your city yet"}
            {friends > 1 ? ` · stay split ${friends} ways` : " · solo stay"}
          </div>
          <BudgetBar breakdown={adj.breakdown} total={adj.total} days={trip.days} />
          {adj.local && (
            <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8, color: T.cobalt }}>
              📍 You're basically local — travel here is just getting around town.
            </div>
          )}
          {/* flyable trips are priced as flying so the headline matches the
              Flights button; when the road trip beats the fare, pitch it as
              the savings play instead of silently baking it into the math */}
          {adj.driveGas != null && (
            <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8, color: T.cobalt }}>
              🚗 Money hack: road-trip it and "getting there" drops to ~{fmt(adj.driveGas)} —
              gas{friends > 1 ? ` split ${friends} ways` : ""}, about {adj.driveH} hr each way.
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8, opacity: 0.65 }}>
            Whole crew of {friends}: {fmt(adj.total * friends)} total
          </div>
          {trip.fly && <LiveFare originCode={AIRPORTS[origin]} dest={trip.fly} dates={dates} />}
          <SectionLabel>The plan</SectionLabel>
          {/* day-by-day timeline: chip + rail instead of dashed rows */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {trip.plan.map((p, i) => {
              const dash = p.indexOf("—");
              const label = dash > -1 && dash < 12 ? p.slice(0, dash).trim() : `Day ${i + 1}`;
              const body = dash > -1 && dash < 12 ? p.slice(dash + 1).trim() : p;
              return (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <span style={{ background: T.sun, border: `2px solid ${T.ink}`, borderRadius: R.pill,
                      fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 11.5,
                      padding: "4px 10px", whiteSpace: "nowrap" }}>{label}</span>
                    {i < trip.plan.length - 1 && (
                      <span style={{ flex: 1, width: 2, background: T.ink, opacity: 0.18, margin: "4px 0" }} />
                    )}
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 500, margin: 0,
                    padding: `3px 0 ${i < trip.plan.length - 1 ? 16 : 0}px` }}>{body}</p>
                </div>
              );
            })}
          </div>
          <SectionLabel>Affordable hacks</SectionLabel>
          {trip.hacks.map((h, i) => (
            <div key={i} style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: 12,
              boxShadow: SH.card, padding: "10px 13px", fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>💸 {h}</div>
          ))}
          {member ? (
            <div style={{ background: "#E8F5EC", border: `2px solid ${T.ink}`, borderRadius: 12,
              padding: "10px 13px", fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>
              ✦ Price-drop alert ON — we'll text you when {origin} → {trip.name.split(",")[0]} fares dip.
            </div>
          ) : (
            <button onClick={onJoin}
              style={{ width: "100%", textAlign: "left", background: T.ink, color: T.paper, border: `2px solid ${T.ink}`,
                borderRadius: 12, padding: "10px 13px", fontSize: 13.5, fontWeight: 700, marginBottom: 10, cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif" }}>
              🔒 Sendoff+ members get price-drop alerts on this trip + exclusive fare deals · $3.99/mo →
            </button>
          )}
          <SectionLabel>Book it — searches pre-filled for your crew</SectionLabel>
          {wheelBonus > 0 && (
            <div style={{ background: banked ? "#E8F5EC" : T.sun, border: `2px solid ${T.ink}`, borderRadius: 12,
              padding: "10px 13px", fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>
              {banked
                ? `✅ +${banked} Send Points banked. The wheel called it, you answered.`
                : banked === 0
                  ? "🎡 The wheel picked this one. Points already banked this round, or the server missed the claim."
                  : `🎡 The wheel picked this one. Open any booking search below and +${wheelBonus} Send Points are yours.`}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {links.map((l) => (
              <m.a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" onClick={bookClick}
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={SPRING}
                style={{ background: l.color, color: l.dark ? T.white : T.ink, border: `2px solid ${T.ink}`,
                  borderRadius: 14, boxShadow: SH.card, padding: "12px 13px", textDecoration: "none", display: "block" }}>
                <span style={{ fontSize: 20 }}>{l.emoji}</span>
                <span style={{ display: "block", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15, marginTop: 4 }}>{l.label} ↗</span>
                <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, opacity: 0.85, marginTop: 2 }}>{l.sub}</span>
              </m.a>
            ))}
          </div>
          <FlightPrices trip={trip} origin={origin} friends={friends} dates={dates} />
          <StayBlock trip={trip} friends={friends} dates={dates} />
          <m.button onClick={doShare} whileTap={{ scale: 0.98 }} transition={SPRING}
            style={{ width: "100%", marginTop: 14, background: shared ? "#2BA84A" : T.cobalt, color: T.white,
              border: `2px solid ${T.ink}`, borderRadius: 14, boxShadow: SH.card, padding: "14px",
              fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16, cursor: "pointer", transition: "background .15s" }}>
            {shared ? "Copied! Paste it in the chat 📋" : "Send it to the group chat →"}
          </m.button>
          <div style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.55, marginTop: 8, textAlign: "center" }}>
            Copies a ready-to-paste trip pitch — price split, dates, and all.
          </div>
          <m.button onClick={() => !isDone && onMarkDone(trip)} disabled={isDone}
            whileTap={isDone ? undefined : { scale: 0.98 }} transition={SPRING}
            style={{ width: "100%", marginTop: 10, background: isDone ? "#E8F5EC" : T.white,
              color: T.ink, border: `2px solid ${T.ink}`, borderRadius: 14,
              boxShadow: isDone ? "none" : SH.card, padding: "13px",
              fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15,
              cursor: isDone ? "default" : "pointer" }}>
            {isDone ? "✅ You've done this send" : "I did this trip ✅"}
          </m.button>
          <div style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.55, marginTop: 6, textAlign: "center" }}>
            {isDone ? "Logged to your profile." : "Mark it done and it lands in your profile."}
          </div>
        </div>
      </m.div>
    </m.div>
  );
}

/* ---------- free account: just a name + email ---------- */
export function AccountModal({ origin, onSave, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle");
  const ready = name.trim() && email.includes("@");
  const submit = async () => {
    if (!ready) return;
    setState("sending");
    await sendRequest("New Sendoff signup", { name: name.trim(), email: email.trim(), city: origin });
    onSave({ name: name.trim(), email: email.trim(), joined: new Date().toISOString().slice(0, 10) });
  };
  const input = {
    width: "100%", fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: 16,
    padding: "13px 14px", border: `2px solid ${T.ink}`, borderRadius: 12, background: T.white, color: T.ink,
  };
  return (
    <ModalShell onClose={onClose} maxWidth={380}>
      <div style={{ padding: "24px 22px 26px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 24, lineHeight: 1.2 }}>
            Make it yours
          </div>
          <m.button onClick={onClose} whileTap={{ scale: 0.9 }} transition={SPRING} aria-label="Close"
            style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: T.ink }}>×</m.button>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, opacity: 0.72, marginTop: 8, lineHeight: 1.5 }}>
          Free. Saves your city and crew, and we'll send you the good trips when they drop.
        </p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="your name"
          style={{ ...input, marginTop: 16 }} />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="your email"
          style={{ ...input, marginTop: 8 }} />
        <m.button onClick={submit} disabled={!ready || state === "sending"}
          whileTap={ready ? { scale: 0.98 } : undefined} transition={SPRING}
          style={{ width: "100%", marginTop: 12, background: ready ? T.cobalt : "#B9C0D9", color: T.white,
            border: `2px solid ${T.ink}`, borderRadius: 14, boxShadow: ready ? SH.card : "none",
            padding: "14px", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16,
            cursor: ready ? "pointer" : "not-allowed" }}>
          {state === "sending" ? "Creating…" : "Create my profile →"}
        </m.button>
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.5, marginTop: 10, textAlign: "center" }}>
          No password, no spam. Sendoff+ is the paid tier — this isn't it.
        </div>
      </div>
    </ModalShell>
  );
}

/* ---------- Sendoff+ member profile ---------- */
export function ProfileModal({ profile, setProfile, account, setAccount, member, opened, done, origin, onClose, onSignOut, onGetPlus, writeStore }) {
  const [name, setName] = useState(account.name || profile.name || "");
  const joinedSrc = account.joined || profile.joined;
  const joinedDate = joinedSrc ? new Date(joinedSrc + "T12:00:00") : new Date();
  const year = joinedDate.getFullYear();
  const daysIn = Math.max(1, Math.round((Date.now() - joinedDate.getTime()) / 86400000));
  const initial = (name.trim()[0] || "✦").toUpperCase();
  const save = (v) => {
    setName(v);
    const nextProfile = { ...profile, name: v };
    setProfile(nextProfile);
    writeStore("sendoff_profile", nextProfile);
    const nextAccount = { ...account, name: v };
    setAccount(nextAccount);
    writeStore("sendoff_account", nextAccount);
  };
  return (
    <ModalShell onClose={onClose} maxWidth={420}>
      <div style={{ padding: "22px 22px 26px" }}>

        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 58, height: 58, borderRadius: "50%", background: T.ink, color: T.sun,
            border: `2px solid ${T.ink}`, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 26, flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input value={name} onChange={(e) => save(e.target.value)} placeholder="Add your name"
              style={{ width: "100%", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 21,
                border: "none", background: "transparent", color: T.ink, padding: 0, outline: "none" }} />
            <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.6, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
              {account.email || "no email yet"}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.5, marginTop: 1 }}>
              Member since {year} · {origin}
            </div>
          </div>
          <m.button onClick={onClose} whileTap={{ scale: 0.9 }} transition={SPRING} aria-label="Close"
            style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: T.ink, lineHeight: 1 }}>×</m.button>
        </div>

        {/* plus badge */}
        {member ? (
          <div style={{ marginTop: 16, background: T.ink, color: T.sun, borderRadius: 14, padding: "12px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 17 }}>
              SENDOFF<span style={{ color: T.sun }}>+</span> ACTIVE
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.75 }}>✦ founder member</span>
          </div>
        ) : (
          <m.button onClick={onGetPlus} whileTap={{ scale: 0.98 }} transition={SPRING}
            style={{ width: "100%", marginTop: 16, background: T.cobalt, color: T.white, border: `2px solid ${T.ink}`,
              borderRadius: 14, boxShadow: SH.card, padding: "13px",
              fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15.5, cursor: "pointer" }}>
            Get Sendoff+ → deal alerts + exclusive drops
          </m.button>
        )}

        {/* stats — tiles pop in one after another */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
          {[[daysIn, daysIn === 1 ? "day in" : "days in"], [done.length, "sends done"], [opened, "sends opened"]].map(([n, label], i) => (
            <m.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.06 + i * 0.06 }}
              style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: 14,
                padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22 }}>{n}</div>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, marginTop: 2 }}>{label}</div>
            </m.div>
          ))}
        </div>

        <SendPoints />

        {/* perks */}
        {done.length > 0 && (
          <>
            <SectionLabel>Sends you've done</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {done.map((id) => {
                const t = TRIPS.find((x) => x.id === id);
                if (!t) return null;
                return (
                  <span key={id} style={{ background: "#E8F5EC", border: `2px solid ${T.ink}`, borderRadius: 999,
                    padding: "6px 12px", fontSize: 12.5, fontWeight: 800 }}>
                    {t.img} {t.name}
                  </span>
                );
              })}
            </div>
          </>
        )}

        <SectionLabel>{member ? "Your perks" : "What Sendoff+ adds"}</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PLUS_PERKS.map(([e, title, sub]) => (
            <div key={title} style={{ display: "flex", gap: 11, alignItems: "flex-start",
              background: T.white, border: `2px solid ${T.ink}`, borderRadius: 13, padding: "11px 13px" }}>
              <span style={{ fontSize: 17, lineHeight: 1.2 }}>{e}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>{title}</div>
                <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, marginTop: 1 }}>{sub}</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: member ? T.cobalt : T.ink, opacity: member ? 1 : 0.35 }}>
                {member ? "ON" : "＋"}
              </span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.55, marginTop: 16, lineHeight: 1.5 }}>
          Deal alerts go out by email while Sendoff+ is in beta. Reply to any alert and a human answers.
        </div>

        <m.button onClick={onSignOut} whileTap={{ scale: 0.98 }} transition={SPRING}
          style={{ marginTop: 16, width: "100%", background: T.white, border: `2px solid ${T.ink}`, borderRadius: 12,
            padding: "11px", fontFamily: "'Instrument Sans', sans-serif", fontWeight: 800, fontSize: 13.5, cursor: "pointer", color: T.ink }}>
          {member ? "Sign out of Sendoff+" : "Sign out"}
        </m.button>
      </div>
    </ModalShell>
  );
}
