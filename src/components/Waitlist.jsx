import React, { useState } from "react";
import { m } from "motion/react";
import { T, R, SH, SPRING } from "../theme.js";
import { CITIES } from "../data/trips.js";

/* ============================================================
   WAITLIST — the December launch list.

   Netlify Forms, not a server. The form Netlify actually registers is the
   hidden copy in index.html (its build-time crawler only reads static HTML,
   never this React tree); this component posts the same field names to it.

   Two ways in, so a submit never depends on JavaScript:
     - JS on  → onSubmit below posts and sends you to /thanks
     - JS off → the browser posts the form natively, action="/thanks"
   Both carry `form-name`, which is how Netlify knows which form it is.

   Honeypot: `bot-field` is hidden from people and left empty; Netlify drops
   any submission that fills it.
   ============================================================ */

const FORM_NAME = "waitlist";

const encode = (data) =>
  Object.keys(data)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
    .join("&");

export default function Waitlist({ origin }) {
  const [f, setF] = useState({ name: "", email: "", city: origin || "" });
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));
  const cityNames = Object.keys(CITIES);

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
    width: "100%", fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: 16,
    padding: "12px 14px", border: `2px solid ${T.ink}`, borderRadius: 12,
    background: T.white, color: T.ink,
  };
  const labelStyle = {
    fontSize: 12, fontWeight: 800, display: "block", margin: "14px 0 6px",
    letterSpacing: 0.4, color: T.paper,
  };

  return (
    <section style={{ maxWidth: 960, margin: "0 auto", padding: "8px 20px 0" }}>
      <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}
        style={{ background: T.ink, color: T.paper, border: `2px solid ${T.ink}`,
          borderRadius: 20, boxShadow: SH.big, padding: "22px 24px" }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, color: T.sun,
          textTransform: "uppercase" }}>
          Launching November 1 · Florida first
        </div>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
          fontSize: "clamp(23px, 5vw, 32px)", lineHeight: 1.2, letterSpacing: "-0.5px", marginTop: 8 }}>
          Get on the list.
        </div>
        <p style={{ fontSize: 14.5, fontWeight: 600, opacity: 0.8, marginTop: 8, lineHeight: 1.5, maxWidth: 560 }}>
          Sendoff opens November 1, starting with Florida. Leave your city and you're first through
          the door when it does.
        </p>

        <form
          name={FORM_NAME}
          method="POST"
          action="/thanks"
          data-netlify="true"
          netlify-honeypot="bot-field"
          onSubmit={submit}
          style={{ marginTop: 6 }}
        >
          {/* Netlify needs the form's name in the POST body itself. */}
          <input type="hidden" name="form-name" value={FORM_NAME} />
          {/* Honeypot: off-screen, not tabbable, never autofilled. */}
          <p hidden>
            <label>Leave this empty: <input name="bot-field" tabIndex={-1} autoComplete="off" /></label>
          </p>

          <label style={labelStyle} htmlFor="wl-name">YOUR NAME</label>
          <input id="wl-name" name="name" required autoComplete="name" placeholder="Alex"
            value={f.name} onChange={set("name")} style={inputStyle} />

          <label style={labelStyle} htmlFor="wl-email">EMAIL</label>
          <input id="wl-email" name="email" type="email" required autoComplete="email"
            placeholder="you@email.com" value={f.email} onChange={set("email")} style={inputStyle} />

          <label style={labelStyle} htmlFor="wl-city">YOUR CITY</label>
          <input id="wl-city" name="city" required autoComplete="address-level2" list="waitlist-cities"
            placeholder="Miami" value={f.city} onChange={set("city")} style={inputStyle} />
          <datalist id="waitlist-cities">
            {cityNames.map((c) => <option key={c} value={c} />)}
          </datalist>

          {err && (
            <div style={{ marginTop: 12, fontSize: 13.5, fontWeight: 700, color: T.sun }}>{err}</div>
          )}

          <m.button type="submit" disabled={sending}
            whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={SPRING}
            style={{ width: "100%", marginTop: 18, background: T.cobalt, color: T.onCobalt,
              border: `2px solid ${T.ink}`, borderRadius: R.card, boxShadow: SH.card, padding: "15px",
              fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 17,
              cursor: sending ? "default" : "pointer", opacity: sending ? 0.7 : 1 }}>
            {sending ? "Sending…" : "Save my spot →"}
          </m.button>
        </form>
      </m.div>
    </section>
  );
}
