import React from "react";
import { T } from "../theme.js";
import { INSTAGRAM_URL, INSTAGRAM_HANDLE, CUSTOM_CONTACT_EMAIL as CONTACT_EMAIL } from "../data/config.js";

/* ============ FOOTER ============
   The page used to stop dead after the last section. A site that takes card
   payments needs somewhere to find the people behind it and the rules:
   support address, Instagram, Terms, Privacy. /terms and /privacy are plain
   HTML in public/ so they load without the app and crawlers can read them. */

const link = {
  color: "inherit", fontWeight: 700, textDecoration: "none",
  borderBottom: `2px solid ${T.sun}`, paddingBottom: 1,
};

export default function Footer() {
  return (
    <footer style={{ maxWidth: 960, margin: "40px auto 0", padding: "26px 20px calc(96px + env(safe-area-inset-bottom))",
      borderTop: `2px solid ${T.ink}`, color: T.ink, fontFamily: "'Instrument Sans', sans-serif" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 22px", alignItems: "center", fontSize: 14, fontWeight: 600 }}>
        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16, marginRight: "auto" }}>
          Sendoff ✈️
        </span>
        <a href={`mailto:${CONTACT_EMAIL}`} style={link}>{CONTACT_EMAIL}</a>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={link}>@{INSTAGRAM_HANDLE}</a>
        <a href="/terms" style={link}>Terms</a>
        <a href="/privacy" style={link}>Privacy</a>
      </div>
      <div style={{ marginTop: 14, fontSize: 12.5, fontWeight: 600, opacity: 0.6, lineHeight: 1.5 }}>
        Prices are per person and come from real fares and researched costs; booking happens on the airline, hotel or
        partner's site and some links pay Sendoff a commission. © 2026 Sendoff. Go while you're young.
      </div>
    </footer>
  );
}
