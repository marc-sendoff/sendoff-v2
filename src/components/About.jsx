import React from "react";
import { m } from "motion/react";
import { T, R, SH, SPRING } from "../theme.js";
import { CUSTOM_CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "../data/config.js";

/* ---------- ABOUT ---------- */
export default function About({ setView }) {
  return (
    <section style={{ maxWidth: 680, margin: "0 auto", padding: "26px 20px 44px" }}>
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
          fontSize: "clamp(28px, 6.5vw, 44px)", lineHeight: 1.15, letterSpacing: "-0.8px" }}>
        Four of us. One couch.<br />
        <span style={{ color: T.cobalt, borderBottom: `6px solid ${T.sun}` }}>Nowhere to go.</span>
      </m.div>

      <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.05 }}
        style={{ marginTop: 20, fontSize: 16, fontWeight: 600, lineHeight: 1.65, opacity: 0.85 }}>
        <p style={{ margin: "0 0 14px" }}>
          Sendoff started on a Thursday night. Me and three friends were on the
          couch, all of us saying the same thing: we should go somewhere this weekend. Nobody could
          say where.
        </p>
        <p style={{ margin: "0 0 14px" }}>
          So we did what everyone does — opened the travel sites. Every one of them asked the same
          first question: <em>where are you going?</em> That was the whole problem. We didn't know
          where. We knew what we had, which was about four hundred bucks each and two days off.
        </p>
        <p style={{ margin: "0 0 14px" }}>
          An hour later we still had nothing. We ordered food and stayed on the couch. That weekend
          didn't happen, and honestly a lot of weekends before it didn't happen either.
        </p>
        <p style={{ margin: "0 0 14px" }}>
          So I built the thing we actually needed. You tell Sendoff your city, your budget and your
          crew — and it tells you where you can go. Real prices, real plans, the hacks that make it
          affordable, and the links to book it. Backwards from every other travel site, which is
          exactly the point.
        </p>
      </m.div>

      {/* The honest part. The relaunch note — one founder, December, Miami.
          Set apart from the origin story above because it is the turn, not a
          footnote: the shutdown and the comeback in Marc's own words. */}
      <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.08 }}
        style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: 20,
          boxShadow: SH.big, padding: "22px 24px", marginTop: 28 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
          fontSize: 19, borderBottom: `6px solid ${T.sun}`, display: "inline-block", lineHeight: 1.1 }}>
          The honest part.
        </div>
        <div style={{ marginTop: 14, fontSize: 16, fontWeight: 600, lineHeight: 1.65, opacity: 0.85 }}>
          <p style={{ margin: "0 0 14px" }}>
            We started building this as four friends. It didn't survive as four friends — and for
            three days in October, Sendoff was shut down for good. Then the messages came in, and
            the truth got obvious: the idea never failed. It never even got the chance to. The team
            broke; the mission didn't.
          </p>
          <p style={{ margin: "0 0 14px" }}>
            So I rebuilt it alone. One founder, carrying it properly this time — because I'm not
            going to let something stupid destroy a passion.
          </p>
          <p style={{ margin: 0 }}>
            Sendoff launches this December, starting with Miami. The board's lit.{" "}
            <strong style={{ color: T.cobalt }}>Go while you're young.</strong>
          </p>
        </div>
      </m.div>

      <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.1 }}
        style={{ background: T.ink, color: T.paper, border: `2px solid ${T.ink}`, borderRadius: 20,
          boxShadow: SH.big, padding: "22px 24px", marginTop: 28 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 19, color: T.sun }}>
          WHAT WE ACTUALLY BELIEVE
        </div>
        {[
          ["The window is now", "There's a stretch between school and real life where you have time and no money. Most people wait until it's the other way round."],
          ["Budget first, destination second", "Everyone else makes you pick a place then breaks your heart with the price."],
          ["Cheap isn't worse", "A $180 weekend in the mountains beats a $2,000 trip you never take."],
          ["Somebody has to plan it", "Group chats don't book flights. That's the whole reason we exist."],
        ].map(([t2, s2]) => (
          <div key={t2} style={{ marginTop: 16 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15.5 }}>{t2}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.75, marginTop: 3, lineHeight: 1.5 }}>{s2}</div>
          </div>
        ))}
      </m.div>

      <div style={{ marginTop: 26, fontSize: 15, fontWeight: 600, lineHeight: 1.6, opacity: 0.8 }}>
        Sendoff is run by one person and a group chat, out of Miami. If something's broken, or you
        want a trip we don't have yet, email{" "}
        <a href={`mailto:${CUSTOM_CONTACT_EMAIL}`} style={{ color: T.cobalt, fontWeight: 800 }}>{CUSTOM_CONTACT_EMAIL}</a>{" "}
        or DM <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: T.cobalt, fontWeight: 800 }}>@{INSTAGRAM_HANDLE}</a> on Instagram — a real person answers.
      </div>

      <m.button onClick={() => { setView("trips"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={SPRING}
        style={{ width: "100%", marginTop: 24, background: T.cobalt, color: T.white, border: `2px solid ${T.ink}`,
          borderRadius: R.card, boxShadow: SH.card, padding: "15px",
          fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 17, cursor: "pointer" }}>
        Find your send →
      </m.button>
    </section>
  );
}
