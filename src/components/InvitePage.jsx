import React, { useEffect, useState } from "react";
import { m } from "motion/react";
import { T, SH, SPRING } from "../theme.js";
import { TRIPS } from "../data/trips.js";
import { fmt } from "../data/config.js";
import { loadSend, rsvp, fmtRange } from "../lib/sends.js";
import { Countdown, Crew, Chat } from "./Social.jsx";

const F = "'Bricolage Grotesque', sans-serif";

/* sendofftrips.com/s/<code> — what a friend sees. No account needed. */
export default function InvitePage({ code, acct, onOpenTrip, onHome }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [ask, setAsk] = useState(null);         // which status they tapped, while we ask for a name
  const [name, setName] = useState(""); const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => { const d = await loadSend(code); if (d.ok) setData(d.send); else setErr(d.error || "Not found"); };
  useEffect(() => {
    // a nudge email carries ?t=<token>; keep it so their RSVP sticks to them
    const t = new URLSearchParams(window.location.search).get("t");
    if (t) { try { localStorage.setItem(`send:${code}`, t); } catch {} }
    load();
  }, [code]);
  const answer = async (status) => {
    if (data.me) { setBusy(true); const d = await rsvp(code, { status }); setBusy(false); if (d.ok) load(); return; }
    if (acct.user && !ask) {
      setBusy(true); const d = await rsvp(code, { status, name: acct.profile?.name || acct.user.email.split("@")[0], contact: acct.user.email }); setBusy(false);
      if (d.ok) load(); return;
    }
    setAsk(status);
  };
  const submit = async (e) => {
    e.preventDefault(); if (!name.trim()) return;
    setBusy(true); const d = await rsvp(code, { status: ask, name: name.trim(), contact: contact.trim() }); setBusy(false);
    if (d.ok) { setAsk(null); load(); } else setErr(d.error || "Try again");
  };
  const wrap = { maxWidth: 560, margin: "0 auto", padding: "18px 20px 60px" };
  if (err) return <section style={{ ...wrap, textAlign: "center" }}><div style={{ fontSize: 48 }}>🤷</div><div style={{ fontFamily: F, fontWeight: 800, fontSize: 24, marginTop: 10 }}>That send isn't here.</div><div style={{ fontSize: 14, fontWeight: 600, opacity: 0.7, marginTop: 6 }}>The link may be old, or it was deleted.</div><button onClick={onHome} style={{ marginTop: 18, background: T.sun, border: `2px solid ${T.ink}`, borderRadius: 14, padding: "12px 18px", fontFamily: F, fontWeight: 800, cursor: "pointer" }}>See the trips →</button></section>;
  if (!data) return <section style={wrap}><div style={{ fontSize: 14, fontWeight: 700, opacity: 0.6 }}>Loading the send…</div></section>;
  const t = TRIPS.find((x) => x.id === data.trip_id);
  const ins = data.members.filter((x) => x.status === "in");
  const me = data.me;
  const btn = (bg, color = T.ink) => ({ flex: 1, background: bg, color, border: `2px solid ${T.ink}`, borderRadius: 14, boxShadow: SH.card, padding: "14px 10px", fontFamily: F, fontWeight: 800, fontSize: 16, cursor: "pointer", opacity: busy ? 0.6 : 1 });
  const field = { width: "100%", border: `2px solid ${T.ink}`, borderRadius: 12, padding: "11px 12px", fontSize: 15, fontWeight: 600, fontFamily: "inherit", background: T.white, boxSizing: "border-box" };
  return (
    <section style={wrap}>
      <div style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: 20, boxShadow: SH.card, overflow: "hidden" }}>
        <div style={{ position: "relative", height: 170, background: T.cobalt, cursor: t ? "pointer" : "default" }} onClick={() => t && onOpenTrip(t)}>
          {t?.photo && <img src={`/${t.photo}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          <span style={{ position: "absolute", left: 12, top: 12, background: T.sun, border: `2px solid ${T.ink}`, borderRadius: 999, padding: "6px 11px", fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6 }}>
            {me?.is_owner ? "YOUR SEND" : `${data.host.toUpperCase()} INVITED YOU`}
          </span>
        </div>
        <div style={{ padding: "16px 16px 18px" }}>
          <div style={{ fontFamily: F, fontWeight: 800, fontSize: 28, lineHeight: 1.05, letterSpacing: "-0.5px" }}>{data.trip.name}</div>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.72, marginTop: 6 }}>{fmtRange(data.date_out, data.date_back)}{data.origin ? ` · from ${data.origin}` : ""}{data.trip.days ? ` · ${data.trip.days} days` : ""}</div>
          <div style={{ marginTop: 14 }}><Countdown date={data.date_out} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
            <Crew members={data.members} />
            <div style={{ fontSize: 13, fontWeight: 700 }}>{ins.length} in{me ? "" : " · you?"}</div>
          </div>
          {data.trip.cost ? (
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, background: T.paper, borderRadius: 12, padding: "9px 12px" }}>
              <span>Your share, all in</span><span>{fmt(data.trip.cost)} · flights, stay, food, fun</span>
            </div>
          ) : null}
          {data.note && <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, borderLeft: `3px solid ${T.sun}`, paddingLeft: 10, lineHeight: 1.5 }}>{data.note}</div>}
          {t?.plan && (
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, lineHeight: 1.7, opacity: 0.85, borderLeft: `3px solid ${T.cobalt}`, paddingLeft: 10 }}>
              {t.plan.slice(0, 4).map((p, i) => <div key={i}>{p}</div>)}
            </div>
          )}
          {ask ? (
            <form onSubmit={submit} style={{ marginTop: 16, background: T.paper, border: `2px solid ${T.ink}`, borderRadius: 16, padding: 14 }}>
              <div style={{ fontFamily: F, fontWeight: 800, fontSize: 17 }}>{ask === "in" ? "Nice. Who's this?" : ask === "maybe" ? "Maybe works. Who's this?" : "No worries. Who's this?"}</div>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" maxLength={40} style={{ ...field, marginTop: 10 }} />
              <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email or phone, so they can nudge you (optional)" maxLength={120} style={{ ...field, marginTop: 8 }} />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button type="submit" style={btn(T.sun)}>{ask === "in" ? "I'm in 🙌" : ask === "maybe" ? "Put me as maybe" : "Can't make it"}</button>
                <button type="button" onClick={() => setAsk(null)} style={{ ...btn(T.white), flex: "0 0 auto", boxShadow: "none" }}>Back</button>
              </div>
            </form>
          ) : me ? (
            <div style={{ marginTop: 16, background: me.status === "in" ? T.sun : T.paper, border: `2px solid ${T.ink}`, borderRadius: 14, padding: "12px 14px", fontWeight: 800, fontSize: 15, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span>{me.status === "in" ? `You're in, ${me.name} ✓` : me.status === "maybe" ? `${me.name}, you're a maybe` : me.status === "out" ? `${me.name}, you're out` : `${me.name}, you haven't answered`}</span>
              {!me.is_owner && <span style={{ display: "flex", gap: 6 }}>
                {me.status !== "in" && <button onClick={() => answer("in")} style={{ ...btn(T.ink, T.sun), flex: "0 0 auto", padding: "8px 12px", fontSize: 13, boxShadow: "none" }}>I'm in</button>}
                {me.status !== "out" && <button onClick={() => answer("out")} style={{ ...btn(T.white), flex: "0 0 auto", padding: "8px 12px", fontSize: 13, boxShadow: "none" }}>Out</button>}
              </span>}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <m.button whileTap={{ scale: 0.97 }} transition={SPRING} onClick={() => answer("in")} style={btn(T.sun)}>I'm in 🙌</m.button>
              <m.button whileTap={{ scale: 0.97 }} transition={SPRING} onClick={() => answer("maybe")} style={btn(T.white)}>Maybe</m.button>
              <m.button whileTap={{ scale: 0.97 }} transition={SPRING} onClick={() => answer("out")} style={btn(T.white)}>Can't</m.button>
            </div>
          )}
          {!me && <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.55, marginTop: 8, textAlign: "center" }}>No account needed. One tap and {data.host} sees it.</div>}
          <Chat code={code} me={me} messages={data.messages} onJoin={() => answer("in")} />
        </div>
      </div>
      <div style={{ marginTop: 18, textAlign: "center", fontSize: 13, fontWeight: 700, opacity: 0.65 }}>
        Want your own? <button onClick={onHome} style={{ background: "none", border: "none", color: T.cobalt, fontWeight: 800, cursor: "pointer", fontSize: 13, padding: 0, fontFamily: "inherit" }}>Plan a send on Sendoff →</button>
      </div>
    </section>
  );
}
