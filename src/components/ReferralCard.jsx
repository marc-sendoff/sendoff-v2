import React, { useState, useEffect } from "react";
import { T } from "../theme.js";

/* Your referral link, inside the app — so people with access (founders,
   earned, whitelisted) can share it without ever seeing the gate page.
   Renders nothing until /api/referral-status answers for this browser's
   cookie (ref cookie or app session), so it can never show someone else's
   link and it stays invisible in local dev. */
export default function ReferralCard() {
  const [status, setStatus] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/referral-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && j?.ok && j.refLink) setStatus(j); })
      .catch(() => { /* offline or ungated dev: no card */ });
    return () => { alive = false; };
  }, []);

  if (!status) return null;

  const copy = async () => {
    try { await navigator.clipboard.writeText(status.refLink); } catch { /* link stays selectable */ }
    setCopied(true);
    if (window.gtag) window.gtag("event", "referral_link_copied", { where: "app" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section style={{ maxWidth: 960, margin: "14px auto 0", padding: "0 20px" }}>
      <div style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: 16,
        boxShadow: `4px 4px 0 ${T.shadow}`, padding: "14px 16px", fontFamily: "'Instrument Sans', sans-serif", color: T.ink }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16 }}>
          🎟️ Bring your crew
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 3, opacity: 0.8 }}>
          Friends who join through your link skip ahead of the waitlist
          {status.verifiedReferrals > 0
            ? ` — ${status.verifiedReferrals} ${status.verifiedReferrals === 1 ? "friend has" : "friends have"} joined through you so far.`
            : "."}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <input readOnly value={status.refLink} onFocus={(e) => e.target.select()}
            style={{ flex: 1, minWidth: 200, font: "inherit", fontSize: 13.5, fontWeight: 600,
              border: `2px solid ${T.ink}`, borderRadius: 10, padding: "9px 12px", background: T.paper, color: T.ink }} />
          <button type="button" onClick={copy}
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 14,
              background: copied ? "#1F8A4C" : T.sun, color: copied ? "#fff" : T.ink,
              border: `2px solid ${T.ink}`, borderRadius: 10, padding: "0 16px", cursor: "pointer" }}>
            {copied ? "COPIED ✓" : "COPY LINK"}
          </button>
        </div>
      </div>
    </section>
  );
}
