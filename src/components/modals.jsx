import React, { useState, useEffect } from "react";
import { m } from "motion/react";
import { T, R, SH, SPRING } from "../theme.js";
import { TRIPS } from "../data/trips.js";
import { PLUS_PERKS, fmt, modeLabel, bookLinks, shareText, sendRequest, originBreakdown } from "../data/config.js";
import { senderSince } from "../lib/account.js";
import { THEMES } from "../theme.js";
import { useFounders, SeatCounter } from "./Founders.jsx";
import LiveFare from "./LiveFare.jsx";
import { AIRPORTS } from "../data/trips.js";
import StayBlock from "./StayBlock.jsx";
import { BudgetBar } from "./core.jsx";
import FlightPrices from "./FlightPrices.jsx";

/* Launch-week giveaway window, Nov 1–8 2026 (any time zone's Nov 8 counts). */
const GIVEAWAY_OPEN = (() => { const d = new Date().toISOString().slice(0, 10); return d >= "2026-11-01" && d <= "2026-11-08"; })();

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

const isStudentEmail = (e) => /\.edu(\.[a-z]{2,})?$|\.ac\.[a-z]{2,}$/i.test(String(e || "").trim());
const INPUT = {
  width: "100%", fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: 16,
  padding: "13px 14px", border: `2px solid ${T.ink}`, borderRadius: 12, background: T.white, color: T.ink,
};
const BIG_BTN = (on) => ({
  width: "100%", background: on ? T.cobalt : "#B9C0D9", color: T.white, border: `2px solid ${T.ink}`,
  borderRadius: 14, boxShadow: on ? `4px 4px 0 ${T.shadow}` : "none", padding: "14px",
  fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16, cursor: on ? "pointer" : "not-allowed",
});

/* Sign in / sign up: email in, link out. No passwords anywhere. "signup"
   asks for name and city too; both ride along on the link and land on the
   profile the moment the account exists. */
function SignInBlock({ acct, mode = "login", origin = "", title, sub }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState(origin || "");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | sent | failed
  const [err, setErr] = useState("");
  const signup = mode === "signup";
  const ok = email.includes("@") && (!signup || name.trim());
  const send = async () => {
    if (!ok || state === "sending") return;
    setState("sending"); setErr("");
    try { await acct.signIn(email, signup ? name : "", signup ? city : ""); setState("sent"); }
    catch (e) { setErr(e.message || "Couldn't send the link."); setState("failed"); }
  };
  if (state === "sent") {
    return (
      <div style={{ marginTop: 16, background: T.tint, border: `2px solid ${T.ink}`, borderRadius: 14, padding: "16px 18px", textAlign: "center", color: "#1B1D2A" }}>
        <div style={{ fontSize: 26 }}>📬</div>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 17, marginTop: 4 }}>Check your email</div>
        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.75, marginTop: 4 }}>
          We sent a sign-in link to <strong>{email.trim()}</strong>. Tap it and you're in. Check spam if it's slow.
        </div>
      </div>
    );
  }
  return (
    <>
      {title && <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, marginTop: 16 }}>{title}</div>}
      {sub && <div style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.7, marginTop: 4, lineHeight: 1.45 }}>{sub}</div>}
      {signup && (
        <>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="your name" style={{ ...INPUT, marginTop: 14 }} />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="the city you're in" style={{ ...INPUT, marginTop: 8 }} />
        </>
      )}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
        placeholder="your email" style={{ ...INPUT, marginTop: signup ? 8 : 14 }} />
      <button onClick={send} disabled={!ok || state === "sending"} style={{ ...BIG_BTN(ok), marginTop: 10 }}>
        {state === "sending" ? "Sending…" : signup ? "Create my account →" : "Email me a sign-in link →"}
      </button>
      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.55, marginTop: 8, textAlign: "center" }}>
        {err || "No password. The link signs you in on this device."}
      </div>
    </>
  );
}

export function SignInModal({ acct, origin, onClose }) {
  const [mode, setMode] = useState("login");
  return (
    <ModalShell onClose={onClose} maxWidth={380}>
      <div style={{ padding: "22px 22px 26px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, background: T.white, border: `2px solid ${T.ink}`, borderRadius: 999, padding: 4 }}>
            {[["login", "Log in"], ["signup", "Sign up"]].map(([id, label]) => (
              <button key={id} onClick={() => setMode(id)}
                style={{ background: mode === id ? T.ink : "transparent", color: mode === id ? T.paper : T.ink, border: "none",
                  borderRadius: 999, padding: "8px 16px", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 13.5, cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>
          <m.button onClick={onClose} whileTap={{ scale: 0.9 }} transition={SPRING} aria-label="Close"
            style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: T.ink }}>×</m.button>
        </div>
        {GIVEAWAY_OPEN && mode === "signup" && (
          <a href="/giveaway" target="_blank" rel="noopener noreferrer"
            style={{ display: "block", margin: "0 0 12px", background: T.sun, color: T.ink, border: `2px solid ${T.ink}`,
              borderRadius: 12, padding: "9px 12px", fontSize: 13, fontWeight: 800, textDecoration: "none", lineHeight: 1.35 }}>
            🎁 Launch week: sign up by Nov 8 and you're in the draw for a send for two. Rules →
          </a>
        )}
        {mode === "login"
          ? <SignInBlock key="login" acct={acct} mode="login" title="Welcome back." sub="Pop your email in and we'll send you a link." />
          : <SignInBlock key="signup" acct={acct} mode="signup" origin={origin} title="New here?" sub="Free. Your city, your crew and the sends you've done, saved on every device." />}
      </div>
    </ModalShell>
  );
}

export function PlusModal({ origin, acct, onClose, onUnlocked }) {
  const [plan, setPlan] = useState("yr");
  const founders = useFounders();
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const user = acct?.user;
  const student = isStudentEmail(user?.email);

  const checkout = async () => {
    if (busy) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json", ...acct.authHeaders() },
        body: JSON.stringify({ plan: plan === "yr" ? "year" : "month" }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.url) { window.location.assign(j.url); return; }
      setErr(r.status === 503 ? "Checkout isn't switched on yet. Use an access code, or check back soon." : (j.error || "Couldn't start checkout."));
    } catch { setErr("Couldn't reach checkout. Try again in a moment."); }
    setBusy(false);
  };
  const tryCode = async () => {
    /* the code lives server-side only (/api/plus-code): the bundle carries no
       secret and wrong guesses are throttled per IP */
    try {
      const r = await fetch("/api/plus-code", {
        method: "POST", headers: { "Content-Type": "application/json", ...acct.authHeaders() },
        body: JSON.stringify({ code: code.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) { setCodeErr(""); await acct.refresh(); onUnlocked(); }
      else if (r.status === 429) setCodeErr("Too many tries — wait a few minutes, then try again.");
      else if (r.status === 503) setCodeErr("Codes aren't working right now — try again later.");
      else setCodeErr("That code isn't right — check it and try again.");
    } catch {
      setCodeErr("Couldn't check the code — try again in a moment.");
    }
  };
  const codeBad = codeErr !== "";

  return (
    <ModalShell onClose={onClose} maxWidth={420} zIndex={120}>
        <div style={{ background: T.ink, color: T.paper, padding: "22px 22px 18px", borderRadius: "20px 20px 0 0", position: "relative" }}>
          <m.button onClick={onClose} whileTap={{ scale: 0.92 }} transition={SPRING} aria-label="Close"
            style={{ position: "absolute", top: 14, right: 14, width: 32, height: 32, borderRadius: "50%",
              border: `2px solid ${T.paper}`, background: "transparent", color: T.paper, fontWeight: 800, cursor: "pointer" }}>✕</m.button>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 28 }}>
            SENDOFF<span style={{ color: T.sun }}>+</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.85, marginTop: 4 }}>
            Every trip, every deal, the day it lands.
          </div>
          {/* Launch-week giveaway, Nov 1–8: everyone who joins is entered.
              Rules (and the free way to enter) live at /giveaway. */}
          {GIVEAWAY_OPEN && (
            <a href="/giveaway" target="_blank" rel="noopener noreferrer"
              style={{ display: "block", marginTop: 12, background: T.sun, color: T.ink, border: `2px solid ${T.ink}`,
                borderRadius: 12, padding: "9px 12px", fontSize: 13, fontWeight: 800, textDecoration: "none", lineHeight: 1.35 }}>
              🎁 Launch week: every account made by Nov 8 is in the draw for a send for two. Rules →
            </a>
          )}
        </div>
        <div style={{ padding: "18px 22px 24px" }}>
          {PLUS_PERKS.map(([e, title, sub]) => (
            <div key={title} style={{ display: "flex", gap: 12, padding: "9px 0", alignItems: "flex-start" }}>
              <span style={{ fontSize: 20 }}>{e}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>{title}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.65 }}>
                  {title === "Deal drops" ? `Every drop from ${origin}, the day the fare lands` : sub}
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            {[["mo", "$4.99", "/month"], ["yr", "$40", "/year · save 33%"]].map(([id, price, per]) => (
              <m.button key={id} onClick={() => setPlan(id)} whileTap={{ scale: 0.97 }} transition={SPRING}
                style={{ flex: 1, background: plan === id ? T.sun : T.white, border: `2px solid ${T.ink}`,
                  borderRadius: 14, boxShadow: plan === id ? SH.card : "none", padding: "12px 8px",
                  cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif", color: T.ink }}>
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 20 }}>{price}</div>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>{per}</div>
              </m.button>
            ))}
          </div>

          {founders && founders.left > 0 && (
            <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, opacity: 0.8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <SeatCounter data={founders} />
              <span>Go yearly and you're a Founder: numbered seat, spring box, your own look.</span>
            </div>
          )}
          {!user ? (
            <SignInBlock acct={acct} mode="signup" origin={origin} title="Sign in to get Sendoff+" sub="Plus lives on your account, so it works on your phone and your laptop. Already have one? Just use the same email." />
          ) : (
            <>
              <button onClick={checkout} disabled={busy} style={{ ...BIG_BTN(!busy), marginTop: 14 }}>
                {busy ? "Opening checkout…" : `Get Sendoff+ · ${plan === "yr" ? "$40/year" : "$4.99/month"} →`}
              </button>
              {student && (
                <div style={{ marginTop: 8, background: T.sun, border: `2px solid ${T.ink}`, borderRadius: 10,
                  padding: "8px 12px", fontSize: 12.5, fontWeight: 800 }}>
                  🎓 Student email spotted — 5% off, applied at checkout.
                </div>
              )}
              <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.55, marginTop: 8, textAlign: "center" }}>
                {err || "Secure checkout by Stripe · cancel anytime"}
              </div>

              {/* access code unlock */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 12px" }}>
                <div style={{ flex: 1, height: 2, background: T.ink, opacity: 0.15 }} />
                <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.5, letterSpacing: 1 }}>OR</span>
                <div style={{ flex: 1, height: 2, background: T.ink, opacity: 0.15 }} />
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, color: T.cobalt,
                textTransform: "uppercase", marginBottom: 8 }}>
                Got an access code?
              </div>
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
                    cursor: "pointer", color: T.ink, boxShadow: `3px 3px 0 ${T.shadow}` }}>
                  Unlock
                </button>
              </div>
              {codeBad && (
                <div style={{ fontSize: 12, fontWeight: 700, color: T.poppy, marginTop: 7 }}>{codeErr}</div>
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
              ? `✈️ Flights are a live fare from ${origin}${trip.fareMonth ? ` for ${monthLabel(trip.fareMonth)}` : ""}, refreshed a few times a day`
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
            <div style={{ background: T.tint, border: `2px solid ${T.ink}`, borderRadius: 12,
              padding: "10px 13px", fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>
              ✦ Price-drop alert ON — we'll text you when {origin} → {trip.name.split(",")[0]} fares dip.
            </div>
          ) : (
            <button onClick={onJoin}
              style={{ width: "100%", textAlign: "left", background: T.ink, color: T.paper, border: `2px solid ${T.ink}`,
                borderRadius: 12, padding: "10px 13px", fontSize: 13.5, fontWeight: 700, marginBottom: 10, cursor: "pointer",
                fontFamily: "'Instrument Sans', sans-serif" }}>
              🔒 Sendoff+ unlocks every send in your budget, plus the deal drops · $4.99/mo →
            </button>
          )}
          <SectionLabel>Book it — searches pre-filled for your crew</SectionLabel>
          {wheelBonus > 0 && (
            <div style={{ background: banked ? T.tint : T.sun, border: `2px solid ${T.ink}`, borderRadius: 12,
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
            style={{ width: "100%", marginTop: 10, background: isDone ? T.tint : T.white,
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
/* ---------- the profile card ---------- */
export function ProfileModal({ acct, opened, origin, onClose, onGetPlus, themeName, onTheme }) {
  const { user, profile, membership, isMember, done, saved, spent } = acct;
  const [name, setName] = useState(profile?.name || "");
  useEffect(() => { setName(profile?.name || ""); }, [profile?.name]);
  const since = senderSince(profile, user);
  const initial = (name.trim()[0] || user?.email?.[0] || "✦").toUpperCase();
  const founder = membership?.plan === "founder";
  const badge = founder ? `✦ Founder${membership.founder_number ? ` #${membership.founder_number}` : ""}` : isMember ? "✦ Sendoff+" : "Member";
  const saveName = () => { if ((profile?.name || "") !== name.trim()) acct.saveProfile({ name: name.trim() }); };
  const nice = (iso) => iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const [portalBusy, setPortalBusy] = useState(false);
  const portal = async () => {
    setPortalBusy(true);
    try {
      const r = await fetch("/api/portal", { method: "POST", headers: acct.authHeaders() });
      const j = await r.json().catch(() => ({}));
      if (j.url) { window.location.assign(j.url); return; }
    } catch { /* fall through */ }
    setPortalBusy(false);
  };
  const stats = [
    [done.length, done.length === 1 ? "send done" : "sends done"],
    [saved.length, "saved"],
    spent > 0 ? [fmt(spent), "spent on sends"] : [opened, "sends opened"],
  ];
  return (
    <ModalShell onClose={onClose} maxWidth={420}>
      <div style={{ padding: "22px 22px 26px" }}>

        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 58, height: 58, borderRadius: "50%", background: isMember ? T.ink : T.sun, color: isMember ? T.sun : T.ink,
            border: `2px solid ${T.ink}`, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 26, flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName}
              onKeyDown={(e) => e.key === "Enter" && e.target.blur()} placeholder="Add your name"
              style={{ width: "100%", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 21,
                border: "none", background: "transparent", color: T.ink, padding: 0, outline: "none" }} />
            <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.6, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.email}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.5, marginTop: 1 }}>
              Sender since {since} · {origin}
            </div>
          </div>
          <m.button onClick={onClose} whileTap={{ scale: 0.9 }} transition={SPRING} aria-label="Close"
            style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: T.ink, lineHeight: 1 }}>×</m.button>
        </div>

        {/* membership */}
        {isMember ? (
          <div style={{ marginTop: 16, background: T.ink, color: T.onInk, borderRadius: 14, padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 17 }}>{badge.toUpperCase()}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.75 }}>
                {membership?.source === "stripe"
                  ? (membership.cancel_at_period_end ? `ends ${nice(membership.current_period_end)}` : `renews ${nice(membership.current_period_end)}`)
                  : membership?.source === "code" ? "access code" : "active"}
              </span>
            </div>
            {membership?.source === "stripe" && (
              <button onClick={portal} disabled={portalBusy}
                style={{ marginTop: 10, background: "transparent", color: T.paper, border: `2px solid ${T.paper}`, borderRadius: 10,
                  padding: "7px 12px", fontFamily: "'Instrument Sans', sans-serif", fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>
                {portalBusy ? "Opening…" : "Manage billing"}
              </button>
            )}
          </div>
        ) : (
          <m.button onClick={onGetPlus} whileTap={{ scale: 0.98 }} transition={SPRING}
            style={{ width: "100%", marginTop: 16, background: T.cobalt, color: T.onCobalt, border: `2px solid ${T.ink}`,
              borderRadius: 14, boxShadow: SH.card, padding: "13px",
              fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15.5, cursor: "pointer" }}>
            Get Sendoff+ → every trip + deal drops
          </m.button>
        )}

        {/* Founders pick the app's look */}
        {founder && onTheme && (
          <>
            <SectionLabel>Your look</SectionLabel>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(THEMES).map(([id, th]) => (
                <button key={id} onClick={() => onTheme(id)}
                  style={{ flex: 1, background: th.paper, color: th.ink, border: `${themeName === id ? 3 : 2}px solid ${T.ink}`, borderRadius: 12,
                    padding: "10px 8px", cursor: "pointer", boxShadow: themeName === id ? SH.card : "none",
                    fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 12.5 }}>
                  <div style={{ height: 8, borderRadius: 999, background: th.cobalt, marginBottom: 6 }} />
                  {th.label}{themeName === id ? " ✓" : ""}
                </button>
              ))}
            </div>
          </>
        )}

        {/* stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
          {stats.map(([n, label], i) => (
            <m.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.06 + i * 0.06 }}
              style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: 14, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22 }}>{n}</div>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, marginTop: 2 }}>{label}</div>
            </m.div>
          ))}
        </div>

        {done.length > 0 && (
          <>
            <SectionLabel>Sends you've done</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {done.map((row) => {
                const t = TRIPS.find((x) => x.id === row.trip_id);
                if (!t) return null;
                return (
                  <span key={row.trip_id} style={{ background: T.tint, border: `2px solid ${T.ink}`, borderRadius: 999,
                    padding: "6px 12px", fontSize: 12.5, fontWeight: 800 }}>
                    {t.img} {t.name}{row.spent ? ` · ${fmt(row.spent)}` : ""}
                  </span>
                );
              })}
            </div>
          </>
        )}

        <SectionLabel>{isMember ? "Your perks" : "What Sendoff+ adds"}</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PLUS_PERKS.map(([e, title, sub]) => (
            <div key={title} style={{ display: "flex", gap: 11, alignItems: "flex-start",
              background: T.white, border: `2px solid ${T.ink}`, borderRadius: 13, padding: "11px 13px" }}>
              <span style={{ fontSize: 17, lineHeight: 1.2 }}>{e}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>{title}</div>
                <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, marginTop: 1 }}>{sub}</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: isMember ? T.cobalt : T.ink, opacity: isMember ? 1 : 0.35 }}>
                {isMember ? "ON" : "＋"}
              </span>
            </div>
          ))}
        </div>

        <m.button onClick={async () => { await acct.signOut(); onClose(); }} whileTap={{ scale: 0.98 }} transition={SPRING}
          style={{ marginTop: 16, width: "100%", background: T.white, border: `2px solid ${T.ink}`, borderRadius: 12,
            padding: "11px", fontFamily: "'Instrument Sans', sans-serif", fontWeight: 800, fontSize: 13.5, cursor: "pointer", color: T.ink }}>
          Sign out
        </m.button>
      </div>
    </ModalShell>
  );
}
