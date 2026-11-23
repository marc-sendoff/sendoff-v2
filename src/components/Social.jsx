import React, { useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import { T, SH, SPRING } from "../theme.js";
import { TRIPS } from "../data/trips.js";
import { fmt } from "../data/config.js";
import { mySends, createSend, sendMessage, nudge, deleteSend, loadSend, sendUrl, fmtRange } from "../lib/sends.js";

const F = "'Bricolage Grotesque', sans-serif";
const tripOf = (id) => TRIPS.find((t) => t.id === id);

/* days / hrs / min / sec until the morning of departure */
export function Countdown({ date }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  if (!date) return <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.6 }}>No dates yet</div>;
  const ms = new Date(date + "T08:00:00").getTime() - now;
  if (ms <= 0) return <div style={{ fontFamily: F, fontWeight: 800, fontSize: 18, color: T.cobalt }}>It's send day. Go. ✈️</div>;
  const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, mi = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  const cell = (n, l) => (
    <div style={{ flex: 1, background: T.ink, color: T.sun, borderRadius: 12, padding: "9px 0", textAlign: "center" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 24, lineHeight: 1 }}>{String(n).padStart(2, "0")}</div>
      <div style={{ fontSize: 9.5, letterSpacing: 1.4, textTransform: "uppercase", opacity: 0.8, marginTop: 3 }}>{l}</div>
    </div>
  );
  return <div style={{ display: "flex", gap: 8 }}>{cell(d, "days")}{cell(h, "hrs")}{cell(mi, "min")}{cell(s, "sec")}</div>;
}

export function Crew({ members, size = 34 }) {
  const col = (s) => s === "in" ? "#2BA84A" : s === "out" ? "#9A9CAB" : s === "maybe" ? T.poppy : T.poppy;
  const mark = (s) => s === "in" ? "✓" : s === "out" ? "✕" : "?";
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {members.map((mb, i) => (
        <div key={mb.id} title={`${mb.name} · ${mb.status}`} style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${T.ink}`,
          background: mb.status === "in" ? T.sun : T.white, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 800, fontSize: size * 0.4, marginLeft: i ? -8 : 0, position: "relative" }}>
          {mb.name.trim()[0]?.toUpperCase()}
          <span style={{ position: "absolute", right: -5, bottom: -5, width: 15, height: 15, borderRadius: "50%", background: col(mb.status), color: "#fff",
            fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>{mark(mb.status)}</span>
        </div>
      ))}
    </div>
  );
}

/* the chat under a send — polls every 6s while open */
export function Chat({ code, me, messages: initial, onJoin }) {
  const [msgs, setMsgs] = useState(initial || []);
  const [text, setText] = useState("");
  const box = useRef(null);
  useEffect(() => {
    const tick = async () => { const d = await loadSend(code); if (d.ok) setMsgs(d.send.messages); };
    const i = setInterval(tick, 6000); return () => clearInterval(i);
  }, [code]);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [msgs.length]);
  const submit = async (e) => {
    e.preventDefault(); const t = text.trim(); if (!t) return;
    setText("");
    const d = await sendMessage(code, t);
    if (d.ok) setMsgs((x) => [...x, d.message]);
  };
  const when = (s) => new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return (
    <div style={{ marginTop: 14, border: `2px solid ${T.ink}`, borderRadius: 16, overflow: "hidden", background: T.white }}>
      <div ref={box} style={{ maxHeight: 260, overflowY: "auto", padding: "12px 12px 4px", display: "flex", flexDirection: "column", gap: 8 }}>
        {msgs.length === 0 && <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.55, padding: "6px 0 10px" }}>No messages yet. Say something.</div>}
        {msgs.map((x) => {
          const mine = me && x.member_id === me.id;
          return (
            <div key={x.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%" }}>
              {!mine && <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.6, margin: "0 0 2px 6px" }}>{x.name}</div>}
              <div style={{ background: mine ? T.cobalt : T.paper, color: mine ? "#fff" : T.ink, border: `2px solid ${T.ink}`, borderRadius: 14,
                padding: "8px 12px", fontSize: 14.5, fontWeight: 600, lineHeight: 1.4 }}>{x.body}</div>
              <div style={{ fontSize: 10, opacity: 0.45, margin: "2px 6px 0", textAlign: mine ? "right" : "left" }}>{when(x.created_at)}</div>
            </div>
          );
        })}
      </div>
      {me ? (
        <form onSubmit={submit} style={{ display: "flex", gap: 8, padding: 10, borderTop: `2px solid ${T.ink}` }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message the crew…" maxLength={1000}
            style={{ flex: 1, border: `2px solid ${T.ink}`, borderRadius: 999, padding: "9px 14px", fontSize: 14.5, fontWeight: 600, fontFamily: "inherit", background: T.paper }} />
          <button type="submit" style={{ background: T.sun, border: `2px solid ${T.ink}`, borderRadius: 999, padding: "0 16px", fontFamily: F, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Send</button>
        </form>
      ) : (
        <button onClick={onJoin} style={{ width: "100%", background: T.sun, border: "none", borderTop: `2px solid ${T.ink}`, padding: 12, fontFamily: F, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
          Say you're in to join the chat
        </button>
      )}
    </div>
  );
}

const btn = (bg, color = T.ink) => ({ background: bg, color, border: `2px solid ${T.ink}`, borderRadius: 14, boxShadow: SH.card, padding: "11px 14px",
  fontFamily: F, fontWeight: 800, fontSize: 14, cursor: "pointer" });

export function SendCard({ send, me, onChanged, onOpenTrip, compact = false }) {
  const t = tripOf(send.trip_id);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(!compact);
  const [note, setNote] = useState("");
  const ins = send.members.filter((x) => x.status === "in");
  const pending = send.members.filter((x) => x.status === "invited" || x.status === "maybe");
  const share = async () => {
    const url = sendUrl(send.code);
    const text = `${send.host} is planning ${send.trip.name}, ${fmtRange(send.date_out, send.date_back)}. Tap to say you're in: ${url}`;
    try { if (navigator.share) { await navigator.share({ text }); return; } await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };
  const doNudge = async (mb) => { const d = await nudge(send.code, mb.id); setNote(d.ok ? `Nudged ${mb.name} 📨` : d.error || "Couldn't nudge"); setTimeout(() => setNote(""), 2500); };
  return (
    <div style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: 20, boxShadow: SH.card, overflow: "hidden" }}>
      <div style={{ position: "relative", height: compact ? 110 : 150, background: T.cobalt, cursor: onOpenTrip ? "pointer" : "default" }} onClick={() => onOpenTrip && t && onOpenTrip(t)}>
        {t?.photo && <img src={`/${t.photo}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        <span style={{ position: "absolute", left: 12, top: 12, background: T.sun, border: `2px solid ${T.ink}`, borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 800, letterSpacing: 0.6 }}>
          {me?.is_owner ? "YOUR SEND" : `${send.host.toUpperCase()}'S SEND`}
        </span>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: 24, lineHeight: 1.05, letterSpacing: "-0.4px" }}>{send.trip.name}</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.72, marginTop: 5 }}>{fmtRange(send.date_out, send.date_back)}{send.origin ? ` · from ${send.origin}` : ""}{send.trip.days ? ` · ${send.trip.days} days` : ""}</div>
        <div style={{ marginTop: 12 }}><Countdown date={send.date_out} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <Crew members={send.members} />
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>{ins.length} in{pending.length ? ` · ${pending.map((x) => x.name).join(", ")} ${pending.length === 1 ? "hasn't" : "haven't"} answered` : ""}</div>
        </div>
        {send.trip.cost ? (
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, background: T.paper, borderRadius: 12, padding: "9px 12px" }}>
            <span>Per person, all in</span><span>{fmt(send.trip.cost)} · {ins.length} going = {fmt(send.trip.cost * Math.max(1, ins.length))}</span>
          </div>
        ) : null}
        {send.note && <div style={{ marginTop: 10, fontSize: 13.5, fontWeight: 600, borderLeft: `3px solid ${T.sun}`, paddingLeft: 10, lineHeight: 1.5 }}>{send.note}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <m.button whileTap={{ scale: 0.97 }} transition={SPRING} onClick={share} style={{ ...btn(T.sun), flex: 1 }}>{copied ? "Link copied ✓" : "Invite the crew 🔗"}</m.button>
          <m.button whileTap={{ scale: 0.97 }} transition={SPRING} onClick={() => setOpen((o) => !o)} style={{ ...btn(T.white), flex: 1 }}>{open ? "Hide chat" : `Chat (${send.messages.length})`}</m.button>
        </div>
        {me?.is_owner && pending.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {pending.map((mb) => <button key={mb.id} onClick={() => doNudge(mb)} style={{ ...btn(T.cobalt, "#fff"), padding: "7px 11px", fontSize: 12, boxShadow: "none" }}>Nudge {mb.name} 💬</button>)}
          </div>
        )}
        {note && <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8, color: T.cobalt }}>{note}</div>}
        {open && <Chat code={send.code} me={me} messages={send.messages} />}
        {me?.is_owner && (
          <button onClick={async () => { if (confirm("Delete this send for everyone?")) { await deleteSend(send.code); onChanged && onChanged(); } }}
            style={{ marginTop: 12, background: "transparent", border: "none", fontSize: 12, fontWeight: 700, opacity: 0.5, cursor: "pointer", color: T.ink, padding: 0 }}>Delete send</button>
        )}
      </div>
    </div>
  );
}

/* the planning sheet: trip, dates, headcount, note */
export function PlanSend({ trips, origin, preset, onDone, onCancel }) {
  const [q, setQ] = useState(preset ? preset.name : "");
  const [trip, setTrip] = useState(preset || null);
  const [out, setOut] = useState(""); const [back, setBack] = useState("");
  const [n, setN] = useState(3); const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const hits = q.length > 1 && !trip ? trips.filter((t) => t.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  const go = async () => {
    if (!trip) { setErr("Pick a trip"); return; }
    setBusy(true); setErr("");
    const d = await createSend({ trip_id: trip.id, origin, date_out: out || null, date_back: back || null, headcount: n, note });
    setBusy(false);
    if (!d.ok) { setErr(d.error || "Something broke"); return; }
    onDone(d);
  };
  const field = { width: "100%", border: `2px solid ${T.ink}`, borderRadius: 12, padding: "11px 12px", fontSize: 15, fontWeight: 600, fontFamily: "inherit", background: T.white, boxSizing: "border-box" };
  const label = { fontSize: 11.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", opacity: 0.65, marginBottom: 6 };
  return (
    <div style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: 20, boxShadow: SH.card, padding: "18px 16px 16px" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 24, letterSpacing: "-0.4px" }}>Plan a send</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.7, marginTop: 4 }}>Pick the trip and the dates. You get a link; they tap once.</div>
      <div style={{ marginTop: 14 }}>
        <div style={label}>Where</div>
        <input value={q} onChange={(e) => { setQ(e.target.value); setTrip(null); }} placeholder="Search a send · Nashville, Tulum…" style={field} />
        {hits.length > 0 && (
          <div style={{ border: `2px solid ${T.ink}`, borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden", marginTop: -2 }}>
            {hits.map((t) => <button key={t.id} onClick={() => { setTrip(t); setQ(t.name); }} style={{ display: "block", width: "100%", textAlign: "left", background: T.white, border: "none", borderTop: `1px solid #E6E2D6`, padding: "10px 12px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{t.name} <span style={{ opacity: 0.55, fontWeight: 600 }}>· {fmt(t.cost)} · {t.days}d</span></button>)}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}><div style={label}>Leaving</div><input type="date" min={today} value={out} onChange={(e) => setOut(e.target.value)} style={field} /></div>
        <div style={{ flex: 1 }}><div style={label}>Back</div><input type="date" min={out || today} value={back} onChange={(e) => setBack(e.target.value)} style={field} /></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ width: 120 }}><div style={label}>How many</div><input type="number" min={1} max={12} value={n} onChange={(e) => setN(Number(e.target.value))} style={field} /></div>
        <div style={{ flex: 1 }}><div style={label}>Note (optional)</div><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} placeholder="Birthday weekend, bring a jacket…" style={field} /></div>
      </div>
      {err && <div style={{ color: T.poppy, fontSize: 13, fontWeight: 800, marginTop: 10 }}>{err}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <m.button whileTap={{ scale: 0.97 }} transition={SPRING} onClick={go} disabled={busy} style={{ ...btn(T.cobalt, "#fff"), flex: 1, opacity: busy ? 0.6 : 1 }}>{busy ? "Making the link…" : "Create the send →"}</m.button>
        <button onClick={onCancel} style={{ ...btn(T.white), boxShadow: "none" }}>Cancel</button>
      </div>
    </div>
  );
}

/* the Social tab */
export default function Social({ acct, origin, planTrip, onPlanned, onSignUp, onOpenTrip, embedded = false }) {
  const [sends, setSends] = useState(null);
  const [planning, setPlanning] = useState(!!planTrip);
  const [made, setMade] = useState(null);
  const refresh = async () => { if (!acct.user) return; const d = await mySends(); if (d.ok) setSends(d.sends); };
  useEffect(() => { refresh(); }, [acct.user?.id]);
  useEffect(() => { if (planTrip) setPlanning(true); }, [planTrip?.id]);
  const wrap = { maxWidth: 640, margin: "0 auto", padding: "26px 20px 40px" };
  if (!acct.user) {
    return (
      <section style={{ ...wrap, textAlign: "center" }}>
        <div style={{ fontSize: 56, lineHeight: 1 }}>👥</div>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: "clamp(26px, 6vw, 36px)", letterSpacing: "-0.6px", marginTop: 12 }}>Plan a send with your crew.</div>
        <p style={{ fontSize: 15.5, fontWeight: 600, opacity: 0.75, lineHeight: 1.55, margin: "12px auto 0", maxWidth: 420 }}>
          Pick a trip, send one link. Friends tap "I'm in" with no account. You get a countdown, who's coming, the split, and a group chat for the send.
        </p>
        <m.button onClick={onSignUp} whileTap={{ scale: 0.97 }} transition={SPRING} style={{ ...btn(T.sun), marginTop: 20, padding: "14px 24px", fontSize: 16 }}>Sign up free to plan one →</m.button>
        <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.55, marginTop: 12 }}>Got a link from a friend? Just open it, no account needed.</div>
      </section>
    );
  }
  return (
    <section style={embedded ? { marginTop: 16 } : wrap}>
      {embedded ? (
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.2, color: T.cobalt, textTransform: "uppercase" }}>👥 Your sends</div>
      ) : (<>
      <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, color: T.cobalt, textTransform: "uppercase" }}>Social</div>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: "clamp(26px, 6vw, 40px)", lineHeight: 1.1, letterSpacing: "-0.6px", marginTop: 6 }}>
        Your <span style={{ color: T.cobalt, borderBottom: `5px solid ${T.sun}` }}>sends.</span>
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 600, opacity: 0.72, marginTop: 8, lineHeight: 1.5 }}>One link per trip. Friends tap once, you get the countdown and the chat.</div>
      </>)}
      {made && (
        <div style={{ marginTop: 16, background: T.sun, border: `2px solid ${T.ink}`, borderRadius: 16, boxShadow: SH.card, padding: "14px 16px" }}>
          <div style={{ fontFamily: F, fontWeight: 800, fontSize: 18 }}>Your link is live 🎉</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6, wordBreak: "break-all" }}>{made.url}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={async () => { try { if (navigator.share) await navigator.share({ text: `Tap to say you're in: ${made.url}` }); else await navigator.clipboard.writeText(made.url); } catch {} }} style={{ ...btn(T.ink, T.sun), flex: 1 }}>Share it 💬</button>
            <button onClick={() => setMade(null)} style={{ ...btn(T.white), boxShadow: "none" }}>Done</button>
          </div>
        </div>
      )}
      {planning ? (
        <div style={{ marginTop: 16 }}>
          <PlanSend trips={TRIPS} origin={origin} preset={planTrip} onCancel={() => { setPlanning(false); onPlanned && onPlanned(); }}
            onDone={(d) => { setPlanning(false); setMade(d); onPlanned && onPlanned(); refresh(); }} />
        </div>
      ) : (
        <m.button whileTap={{ scale: 0.97 }} transition={SPRING} onClick={() => setPlanning(true)} style={{ ...btn(T.sun), width: "100%", marginTop: embedded ? 10 : 16, padding: embedded ? 12 : 14, fontSize: embedded ? 15 : 16 }}>+ Plan a send</m.button>
      )}
      <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
        {sends === null && <div style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.6 }}>Loading your sends…</div>}
        {sends && sends.length === 0 && !planning && (
          <div style={{ border: `2px dashed ${T.ink}`, borderRadius: 16, padding: "22px 16px", textAlign: "center", fontSize: 14, fontWeight: 700, opacity: 0.65 }}>
            No sends yet. Plan one, or open a link a friend sent you.
          </div>
        )}
        {sends && sends.map((s) => <SendCard key={s.code} send={s} me={s.me} onChanged={refresh} onOpenTrip={onOpenTrip} compact />)}
      </div>
    </section>
  );
}
