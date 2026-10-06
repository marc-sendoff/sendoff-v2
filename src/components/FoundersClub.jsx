import React, { useState, useEffect } from "react";
import { m } from "motion/react";
import { T, SPRING } from "../theme.js";

/* The Founders Club.
 *
 * The perks are public — anyone can read what a seat gets you. Joining is not:
 * there is no buy button anywhere in this file. A request writes "Requested"
 * to Airtable and stops, and a human decides. Every state below is a real
 * server state, not a local guess.
 */

const PERKS = [
  ["⚡", "Sendoff+ included", "Every send in your budget, live deal drops, the price calendar, discounted eSIMs. Yours for as long as you're in the club."],
  ["📦", "2 boxes a year", "Seasonal, themed, shipped to you. One of them is the good one."],
  ["🥂", "1 event a year", "With the Sendoff team. The founders' night, for the founders."],
  ["✦", "Your seat number", "A number nobody else gets, and the club badge on your account."],
];

const card = {
  background: T.white, border: `2px solid ${T.ink}`, borderRadius: 18,
  boxShadow: `5px 5px 0 ${T.ink}`, padding: "18px 20px",
};

export default function FoundersClub() {
  const [data, setData] = useState(null);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const load = () =>
    fetch("/api/founders/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.ok) setData(j); })
      .catch(() => { /* ungated dev or offline: the page still renders */ });

  useEffect(() => { load(); }, []);

  const request = async () => {
    setSending(true); setErr("");
    try {
      const r = await fetch("/api/founders/request", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401 || r.status === 409) setErr("Join the waitlist first — then ask for a seat.");
      else if (r.status === 429) setErr("One request a minute. Try again shortly.");
      else if (!r.ok) setErr("That didn't go through. Try again in a moment.");
      else { await load(); if (window.gtag) window.gtag("event", "founders_seat_requested"); }
    } catch { setErr("That didn't go through. Try again in a moment."); }
    setSending(false);
  };

  const seatsTaken = data?.seatsTaken ?? 0;
  const seatsTotal = data?.seatsTotal ?? 100;
  const price = data?.price ?? 139.99;
  const status = data?.mine?.status ?? null;
  const seatNo = data?.mine?.seatNo ?? null;
  const pct = Math.min(100, Math.round((seatsTaken / seatsTotal) * 100));

  return (
    <section style={{ maxWidth: 960, margin: "0 auto", padding: "26px 20px 8px" }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, color: T.cobalt, textTransform: "uppercase" }}>
        First {seatsTotal} · by approval only
      </div>
      <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
        fontSize: "clamp(28px, 6vw, 46px)", lineHeight: 1.2, letterSpacing: "-0.5px", margin: "8px 0 0" }}>
        The Founders Club
      </h1>
      <p style={{ marginTop: 12, fontSize: 16, fontWeight: 600, opacity: 0.75, maxWidth: 620, lineHeight: 1.5 }}>
        The {seatsTotal} people who backed Sendoff first. ${price.toFixed(2)} a year, renewed yearly.
        You can't buy your way in — every seat is approved by us, one at a time.
      </p>

      {/* seats */}
      <div style={{ ...card, marginTop: 22, maxWidth: 420 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.ink, opacity: 0.55, letterSpacing: 0.5 }}>SEATS TAKEN</div>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 40, lineHeight: 1.1 }}>
          {seatsTaken}<span style={{ fontSize: 20, opacity: 0.5 }}> / {seatsTotal}</span>
        </div>
        <div style={{ height: 12, borderRadius: 999, border: `2px solid ${T.ink}`, background: T.paper, overflow: "hidden", marginTop: 10 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: T.sun, transition: "width .4s" }} />
        </div>
      </div>

      {/* perks */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 16, marginTop: 22 }}>
        {PERKS.map(([icon, title, body]) => (
          <div key={title} style={card}>
            <div style={{ fontSize: 26 }} aria-hidden="true">{icon}</div>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, marginTop: 6 }}>{title}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.72, marginTop: 4, lineHeight: 1.5 }}>{body}</div>
          </div>
        ))}
      </div>

      {/* the gate */}
      <div style={{ ...card, marginTop: 22, background: status === "Member" ? T.ink : T.white,
        color: status === "Member" ? T.paper : T.ink, maxWidth: 620 }}>
        {status === "Member" ? (
          <>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, color: T.sun }}>
              You're in ✦ {seatNo ? `Seat № ${seatNo}` : "Seat pending"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.85, marginTop: 6 }}>
              Every Sendoff+ perk is on, your boxes are queued, and we'll be in touch about the night.
            </div>
          </>
        ) : status === "Approved" ? (
          <>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22 }}>
              You're approved ✦
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.75, marginTop: 6 }}>
              A seat is being held for you. We'll email you to finish it off — nothing to do right now.
            </div>
          </>
        ) : status === "Requested" ? (
          <>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22 }}>
              Request received
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.75, marginTop: 6 }}>
              We read every one. If a seat is right for you we'll email you — there's no queue position to
              refresh and no way to jump it.
            </div>
          </>
        ) : status === "Declined" ? (
          <>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22 }}>
              Not this round
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.75, marginTop: 6 }}>
              Seats are limited and we kept this one back. Sendoff+ gets you every trip in your budget in
              the meantime.
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22 }}>
              Ask for a seat
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.75, marginTop: 6 }}>
              Tell us you want in and we'll take a look. This isn't a checkout — nothing is charged, and a
              request isn't a seat.
            </div>
            <m.button onClick={request} disabled={sending}
              whileHover={sending ? undefined : { y: -2 }} whileTap={sending ? undefined : { scale: 0.97 }}
              transition={SPRING}
              style={{ marginTop: 14, background: sending ? "#B9C0D9" : T.cobalt, color: T.white,
                border: `2px solid ${T.ink}`, borderRadius: 14, boxShadow: sending ? "none" : `3px 3px 0 ${T.ink}`,
                padding: "13px 22px", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
                fontSize: 15.5, cursor: sending ? "not-allowed" : "pointer" }}>
              {sending ? "Sending…" : "Request a seat →"}
            </m.button>
            {err && <div style={{ marginTop: 10, fontSize: 13.5, fontWeight: 700, color: T.poppy }}>{err}</div>}
          </>
        )}
      </div>

      <p style={{ marginTop: 18, fontSize: 12.5, fontWeight: 600, opacity: 0.55, maxWidth: 620, lineHeight: 1.6 }}>
        Seats are offered to the first 500 on the waitlist, first come first served, and approved one at a
        time. ${price.toFixed(2)} covers the first year and renews yearly. Boxes and the event are planned
        for members in good standing.
      </p>
    </section>
  );
}
