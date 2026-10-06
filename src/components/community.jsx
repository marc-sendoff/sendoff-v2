import React, { useState } from "react";
import { m } from "motion/react";
import { T, R, SH, SPRING } from "../theme.js";
import { sendRequest, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "../data/config.js";

/* ============================================================
   COMMUNITY — the wall. Add photos + comments as they come in.
   photo: paste any image link. Leave "" for a placeholder tile.
   ============================================================ */
export const COMMUNITY_POSTS = [
  { photo: "", name: "", trip: "", spent: "", handle: "", caption: "" },
  { photo: "", name: "", trip: "", spent: "", handle: "", caption: "" },
  { photo: "", name: "", trip: "", spent: "", handle: "", caption: "" },
];

export const COMMUNITY_COMMENTS = [
  // { text: "...", name: "Maya", where: "FSU" },
];

/* Same heading voice as the detail sheet's SectionLabel (kept local — the
   modals copy lives in another lane's file). */
function WallLabel({ children }) {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, color: T.cobalt,
      textTransform: "uppercase", margin: "34px 0 12px" }}>
      {children}
    </div>
  );
}

export function CommunityCard({ post, i = 0 }) {
  const empty = !post.photo && !post.name;
  return (
    <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: Math.min(i % 6, 5) * 0.045 }}
      whileHover={{ y: -4 }}
      style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: R.card,
        boxShadow: SH.card, overflow: "hidden" }}>
      <div style={{ aspectRatio: "1 / 1", background: T.paper, display: "flex", alignItems: "center",
        justifyContent: "center", borderBottom: `2px solid ${T.ink}` }}>
        {post.photo
          ? <img src={post.photo} alt={post.trip || "A Sendoff"} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 30, opacity: 0.3 }} aria-hidden="true">📸</span>}
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15 }}>
          {post.trip || "Your send here"}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.7, marginTop: 2 }}>
          {empty ? "Tag us and you're on the wall" : `${post.name || "Anonymous"}${post.spent ? " · " + post.spent : ""}`}
        </div>
        {post.caption && (
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginTop: 7, lineHeight: 1.45 }}>
            "{post.caption}"
          </div>
        )}
        {post.handle && (
          <div style={{ fontSize: 12, fontWeight: 800, color: T.cobalt, marginTop: 6 }}>{post.handle}</div>
        )}
      </div>
    </m.div>
  );
}

export function Community({ origin }) {
  const [f, setF] = useState({ name: "", handle: "", trip: "", spent: "", words: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ready = f.name && f.trip;
  const inputStyle = {
    width: "100%", fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: 16,
    padding: "12px 14px", border: `2px solid ${T.ink}`, borderRadius: 12, background: T.white, color: T.ink,
  };
  const labelStyle = { fontSize: 13, fontWeight: 800, display: "block", margin: "14px 0 6px", letterSpacing: 0.3 };
  const submit = async () => {
    setSending(true);
    await sendRequest("Community submission 📸", {
      name: f.name, handle: f.handle, trip: f.trip, spent: f.spent, words: f.words, from_city: origin,
    });
    setSending(false); setSent(true);
  };

  return (
    <section style={{ maxWidth: 900, margin: "0 auto", padding: "26px 20px 44px" }}>
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
          fontSize: "clamp(28px, 6.5vw, 42px)", lineHeight: 1.15, letterSpacing: "-0.8px" }}>
        The <span style={{ color: T.cobalt, borderBottom: `6px solid ${T.sun}` }}>Sendoff wall</span>
      </m.div>
      <p style={{ marginTop: 12, fontSize: 15.5, fontWeight: 600, opacity: 0.75, lineHeight: 1.5, maxWidth: 560 }}>
        Real trips, by real people, at real prices. Every photo here is someone who stopped
        talking about it in the group chat and actually went.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
        gap: 16, marginTop: 22 }}>
        {COMMUNITY_POSTS.map((p, i) => <CommunityCard key={i} post={p} i={i} />)}
      </div>

      {COMMUNITY_COMMENTS.length > 0 && (
        <>
          <WallLabel>What people say</WallLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 14 }}>
            {COMMUNITY_COMMENTS.map((c, i) => (
              <m.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: Math.min(i % 6, 5) * 0.045 }}
                style={{ background: i % 2 ? T.sun : T.white, border: `2px solid ${T.ink}`,
                  borderRadius: R.card, boxShadow: SH.card, padding: "16px 18px" }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.55 }}>"{c.text}"</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, marginTop: 10, opacity: 0.75 }}>
                  — {c.name}{c.where ? `, ${c.where}` : ""}
                </div>
              </m.div>
            ))}
          </div>
        </>
      )}

      {/* submit your send */}
      <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.12 }}
        style={{ background: T.ink, color: T.paper, border: `2px solid ${T.ink}`, borderRadius: 20,
          boxShadow: SH.big, padding: "22px 24px", marginTop: 34 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 21, color: T.sun }}>
          BEEN ON A SEND? GET ON THE WALL.
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, opacity: 0.8, marginTop: 8, lineHeight: 1.5 }}>
          Fill this in and DM us the photo at <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: T.sun, fontWeight: 800 }}>@{INSTAGRAM_HANDLE}</a> — we'll put you up.
        </p>

        {!sent ? (
          <div>
            <label style={{ ...labelStyle, color: T.paper }}>YOUR NAME</label>
            <input style={inputStyle} value={f.name} onChange={set("name")} placeholder="Alex" />
            <label style={{ ...labelStyle, color: T.paper }}>INSTAGRAM (so we can tag you)</label>
            <input style={inputStyle} value={f.handle} onChange={set("handle")} placeholder="@yourhandle" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ ...labelStyle, color: T.paper }}>WHERE'D YOU GO</label>
                <input style={inputStyle} value={f.trip} onChange={set("trip")} placeholder="Smoky Mountains" />
              </div>
              <div>
                <label style={{ ...labelStyle, color: T.paper }}>WHAT'D IT COST</label>
                <input style={inputStyle} value={f.spent} onChange={set("spent")} placeholder="$180 each" />
              </div>
            </div>
            <label style={{ ...labelStyle, color: T.paper }}>ONE LINE ABOUT IT</label>
            <textarea style={{ ...inputStyle, minHeight: 76, resize: "vertical" }} value={f.words} onChange={set("words")}
              placeholder="Cheapest weekend of my life and the best one this year..." />
            <m.button onClick={submit} disabled={!ready || sending} whileTap={{ scale: 0.98 }} transition={SPRING}
              style={{ width: "100%", marginTop: 16, background: ready ? T.sun : "#4A4E63", color: T.ink,
                border: `2px solid ${T.ink}`, borderRadius: 14, padding: "14px",
                fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16,
                cursor: ready ? "pointer" : "not-allowed" }}>
              {sending ? "Sending…" : "Put me on the wall →"}
            </m.button>
          </div>
        ) : (
          <m.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING}
            style={{ background: "#E8F5EC", color: T.ink, borderRadius: 14, padding: "18px", marginTop: 14 }}>
            <div style={{ fontSize: 26 }} aria-hidden="true">📸</div>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, marginTop: 4 }}>
              Got it — now send the photo
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 5, lineHeight: 1.5 }}>
              DM your photo to <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: T.cobalt, fontWeight: 800 }}>@{INSTAGRAM_HANDLE}</a> and we'll add you to the wall this week.
            </div>
          </m.div>
        )}
      </m.div>
    </section>
  );
}
