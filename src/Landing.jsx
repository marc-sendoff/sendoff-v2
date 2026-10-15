import React, { useState } from "react";
import { LazyMotion, MotionConfig, m } from "motion/react";
import { T, R, SH, SPRING } from "./theme.js";

/* Inlined rather than imported from data/config.js on purpose: that module
   pulls in AIRPORTS from trips.js, which would ship all 281 trips to a page
   that shows none of them. Keep this page's imports leaf-only. */
const INSTAGRAM_HANDLE = "sendoff.trips";
const INSTAGRAM_URL = "https://www.instagram.com/sendoff.trips/";

const loadMotionFeatures = () => import("./motion-features.js").then((mod) => mod.default);

/* ============================================================
   LANDING — the whole site until December.

   Signup only: no trips, no tabs, nothing to browse. The full app still
   lives in App.jsx and is not deleted; switching back on is one line in
   main.jsx (render <Sendoff /> instead of <Landing />).

   The form posts to Netlify Forms. Field names must match the hidden
   registration form in index.html — Netlify's crawler reads only that
   static copy, never this React tree.
   ============================================================ */

const FORM_NAME = "waitlist";

/* The rollout, in one place. The page reads these so the dates can never
   disagree with each other. */
export const ROLLOUT = [
  ["Florida", "November 1"],
  ["Rest of the US", "November 15"],
  ["Everywhere else", "December 10"],
];

/* Florida leads the list because Florida opens first, but the last two
   options exist on purpose: 17 of the first 41 signups were from outside
   Florida, and the US opens six weeks after launch. Turning those people
   away now means rebuilding that list from scratch in January. */
const FLORIDA_CITIES = [
  "Miami",
  "Fort Lauderdale",
  "West Palm Beach",
  "Boca Raton",
  "Port St. Lucie",
  "Orlando",
  "Tampa",
  "St. Petersburg",
  "Sarasota",
  "Fort Myers",
  "Naples",
  "Jacksonville",
  "Gainesville",
  "Tallahassee",
  "Daytona Beach",
  "Melbourne",
  "Key West",
  "Pensacola",
  "Somewhere else in Florida",
];

const ELSEWHERE = ["Somewhere else in the US", "Outside the US"];

const encode = (data) =>
  Object.keys(data)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
    .join("&");

function Plane({ size = 74 }) {
  return (
    <svg viewBox="0 0 90 84" width={size} height={size * 0.93} aria-hidden="true" style={{ display: "block" }}>
      <g transform="translate(2,2)">
        <path d="M 2 32 L 82 3 L 52 76 L 37 46 Z" fill={T.cobalt} stroke={T.ink} strokeWidth="5" strokeLinejoin="round" />
        <path d="M 2 32 L 82 3 L 40 40 Z" fill="#4A66F6" stroke={T.ink} strokeWidth="5" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default function Landing() {
  const [f, setF] = useState({ name: "", email: "", city: "" });
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setErr("");
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": FORM_NAME, "bot-field": "", ...f }),
      });
      if (!res.ok) throw new Error(String(res.status));
      if (window.gtag) window.gtag("event", "waitlist_signup", { city: f.city });
      window.location.href = "/thanks";
    } catch {
      setErr("That didn't go through. Try again in a moment.");
      setSending(false);
    }
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: 16,
    padding: "13px 14px", border: `2px solid ${T.ink}`, borderRadius: 12,
    background: T.white, color: T.ink, appearance: "none",
  };
  const labelStyle = {
    fontSize: 11.5, fontWeight: 800, display: "block", margin: "15px 0 6px",
    letterSpacing: 0.8, color: T.ink, opacity: 0.65, textTransform: "uppercase",
  };

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig transition={SPRING}>
        <main style={{
          minHeight: "100svh", background: T.paper, color: T.ink,
          fontFamily: "'Instrument Sans', system-ui, sans-serif",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "40px 20px 56px",
        }}>
          <div style={{ width: "100%", maxWidth: 470 }}>

            <m.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
                fontSize: "clamp(34px, 9vw, 46px)", letterSpacing: "-2px" }}>
                SENDOFF
              </div>
              <Plane size={44} />
            </m.div>

            <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.05 }}
              style={{ textAlign: "center", marginTop: 26 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, color: T.cobalt,
                textTransform: "uppercase" }}>
                Launching November 1 · Florida first
              </div>
              <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
                fontSize: "clamp(29px, 7.4vw, 42px)", lineHeight: 1.14, letterSpacing: "-0.9px",
                margin: "12px 0 0", textWrap: "balance" }}>
                Trips you can{" "}
                <span style={{ color: T.cobalt, borderBottom: `6px solid ${T.sun}` }}>actually afford.</span>
              </h1>
              <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.55, opacity: 0.78,
                margin: "16px 0 0" }}>
                Tell us your city, your budget and your crew — Sendoff tells you where you can go.
                Real prices, real plans, the links to book it.
              </p>
            </m.div>

            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.1 }}
              style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: 20,
                boxShadow: SH.big, padding: "22px 22px 24px", marginTop: 28 }}>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
                fontSize: 21, letterSpacing: "-0.3px" }}>
                Get on the list.
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, opacity: 0.7, margin: "6px 0 0", lineHeight: 1.5 }}>
                We open Florida first and spread out from there. Leave your city and you're first
                through the door the day we reach you.
              </p>

              {/* The dates, said plainly. Someone in Ohio can join today and know
                  exactly when their turn is, instead of guessing or being shut out. */}
              <div style={{ marginTop: 14, border: `2px solid ${T.ink}`, borderRadius: 12, overflow: "hidden" }}>
                {ROLLOUT.map(([where, when], i) => (
                  <div key={where} style={{ display: "flex", justifyContent: "space-between", gap: 12,
                    padding: "9px 12px", fontSize: 13.5, fontWeight: 700,
                    background: i === 0 ? T.sun : "transparent",
                    borderTop: i ? `2px solid ${T.ink}` : "none" }}>
                    <span>{where}</span>
                    <span style={{ opacity: i === 0 ? 1 : 0.65 }}>{when}</span>
                  </div>
                ))}
              </div>

              <form
                name={FORM_NAME}
                method="POST"
                action="/thanks"
                data-netlify="true"
                netlify-honeypot="bot-field"
                onSubmit={submit}
              >
                <input type="hidden" name="form-name" value={FORM_NAME} />
                <p hidden>
                  <label>Leave this empty: <input name="bot-field" tabIndex={-1} autoComplete="off" /></label>
                </p>

                <label style={labelStyle} htmlFor="wl-name">Your name</label>
                <input id="wl-name" name="name" required autoComplete="name" placeholder="Alex"
                  value={f.name} onChange={set("name")} style={inputStyle} />

                <label style={labelStyle} htmlFor="wl-email">Email</label>
                <input id="wl-email" name="email" type="email" required autoComplete="email"
                  placeholder="you@email.com" value={f.email} onChange={set("email")} style={inputStyle} />

                <label style={labelStyle} htmlFor="wl-city">Where are you?</label>
                <select id="wl-city" name="city" required value={f.city} onChange={set("city")}
                  style={{ ...inputStyle, cursor: "pointer", color: f.city ? T.ink : "#8A8A8A",
                    backgroundImage: "linear-gradient(45deg, transparent 50%, #1B1D2A 50%), linear-gradient(135deg, #1B1D2A 50%, transparent 50%)",
                    backgroundPosition: "calc(100% - 20px) 21px, calc(100% - 14px) 21px",
                    backgroundSize: "6px 6px, 6px 6px", backgroundRepeat: "no-repeat" }}>
                  <option value="" disabled>Pick your city</option>
                  <optgroup label="Florida — opens November 1">
                    {FLORIDA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                  <optgroup label="Everywhere else — opens later">
                    {ELSEWHERE.map((c) => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                </select>

                {err && (
                  <div style={{ marginTop: 13, fontSize: 13.5, fontWeight: 700, color: T.poppy }}>{err}</div>
                )}

                <m.button type="submit" disabled={sending}
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                  style={{ width: "100%", marginTop: 22, background: T.cobalt, color: T.onCobalt,
                    border: `2px solid ${T.ink}`, borderRadius: R.card, boxShadow: SH.card, padding: "15px",
                    fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 17,
                    cursor: sending ? "default" : "pointer", opacity: sending ? 0.7 : 1 }}>
                  {sending ? "Sending…" : "Save my spot →"}
                </m.button>
              </form>
            </m.div>

            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...SPRING, delay: 0.16 }}
              style={{ textAlign: "center", marginTop: 26, fontSize: 14, fontWeight: 700, opacity: 0.72 }}>
              Every send goes up at{" "}
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
                style={{ color: T.cobalt, fontWeight: 800, textDecoration: "none" }}>
                @{INSTAGRAM_HANDLE}
              </a>
            </m.div>

            <div style={{ textAlign: "center", marginTop: 30,
              fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16, opacity: 0.85 }}>
              Go while you're young. ✈️
            </div>
          </div>
        </main>
      </MotionConfig>
    </LazyMotion>
  );
}
