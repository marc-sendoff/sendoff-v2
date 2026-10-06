import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { m } from "motion/react";
import { T, PALETTE, R, SH, SPRING } from "../theme.js";
import { fmt, spinCycle, untilText, FREE_SPINS } from "../data/config.js";
import { priceTag } from "../data/pricing.js";

/* ============ SPIN-SEND ============
   Wheel of every send you can actually afford. Where it stops is where you go.

   Three things shape the implementation:

   1. The wheel is drawn to canvas ONCE per trip list, then rotated with a CSS
      transform. Redrawing 60fps (the obvious approach) pins a phone's CPU for
      as long as the tab is open, and this audience is almost entirely mobile.

   2. The trip list is frozen the moment a spin starts (`lockedRef`) and stays
      frozen while the result card is up. The pool is derived from live
      filters, so without the freeze, nudging the budget slider swaps the
      wedges underneath the already-chosen winner and the wheel is left resting
      on the wrong trip. A change that arrives mid-spin is applied when the
      result card closes, not before.

   3. Spins are a shared, server-owned budget: FREE_SPINS per 36-hour cycle,
      and the cycle resets for EVERYONE at the same instant. The server also
      picks the winner, which is what lets it pay the booking bonus only for a
      trip the wheel really chose. A browser that can't reach the server (no
      session, staging without the API, service down) falls back to a local
      count on the same clock: it still spins, it just can't bank points. */

const WHEEL_MAX = 12;        /* wedges — past this, labels are unreadable on a phone */
const SPIN_MS = 4600;
const SIZE = 1000;           /* canvas logical px; scaled by DPR when drawn */
const LOCAL_KEY = "sendoff_spins_v2";

const readStore = (k, fallback) => {
  try { const v = window.localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); }
  catch { return fallback; }
};
const writeStore = (k, v) => { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* Even spread across the affordable list rather than the first N, so a wheel
   built from 40 eligible sends still shows cheap AND aspirational ones. */
function pickWheelTrips(list, count) {
  if (list.length <= count) return [...list];
  const step = list.length / count;
  const out = [];
  for (let i = 0; i < count; i++) out.push(list[Math.floor(i * step + Math.random() * step)] || list[list.length - 1]);
  return [...new Set(out)];
}

/* Local-mode status: same cycle math as the server, counted in this browser. */
function localStatus(now = Date.now()) {
  const { index, resetsAt } = spinCycle(now);
  const saved = readStore(LOCAL_KEY, { cycle: index, n: 0 });
  const used = saved.cycle === index ? saved.n : 0;
  return { mode: "local", cycle: index, resetsAt, used, limit: FREE_SPINS, left: Math.max(0, FREE_SPINS - used), points: 0, bonus: 0 };
}

async function fetchStatus() {
  try {
    const r = await fetch("/api/spins", { headers: { Accept: "application/json" } });
    if (!r.ok) return localStatus();
    const b = await r.json();
    return b.ok ? { mode: "server", ...b } : localStatus();
  } catch { return localStatus(); }
}

export default function SpinSend({ trips, origin, friends, budget, onPick }) {
  const canvasRef = useRef(null);
  const wheelRef = useRef(null);
  const lockedRef = useRef([]);
  const rafRef = useRef(0);
  const timeoutRef = useRef(0);
  const landedRef = useRef(true);
  const angleRef = useRef(0);
  const audioRef = useRef(null);
  const dirtyRef = useRef(false);   /* the pool changed while the wheel was busy */
  const mountedRef = useRef(false);

  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [muted, setMuted] = useState(() => readStore("sendoff_spin_muted", false));
  const [status, setStatus] = useState(null);   /* null until the first fetch answers */
  const [fontsReady, setFontsReady] = useState(false);
  const [, tick] = useState(0);                 /* re-render for the countdown */

  const reduced = typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /* Canvas text renders with whatever font is loaded at draw time — without
     waiting, the first paint is Times New Roman. */
  useEffect(() => {
    let on = true;
    if (typeof document === "undefined" || !document.fonts) { setFontsReady(true); return; }
    document.fonts.ready.then(() => { if (on) setFontsReady(true); });
    return () => { on = false; };
  }, []);

  /* Spin budget: ask the server, fall back to the local count. Re-ask the
     moment the shared clock crosses a reset so the wheel comes back on time. */
  useEffect(() => {
    let on = true;
    fetchStatus().then((s) => { if (on) setStatus(s); });
    return () => { on = false; };
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      tick((n) => n + 1);
      if (status && Date.now() >= status.resetsAt) fetchStatus().then(setStatus);
    }, 15_000);
    return () => clearInterval(id);
  }, [status]);

  const eligible = useMemo(() => trips.filter((t) => t.cost <= budget * 1.15), [trips, budget]);
  const [wheel, setWheel] = useState(() => pickWheelTrips(eligible, WHEEL_MAX));

  /* Reshuffle when the underlying pool changes — but never while a spin is in
     flight or a result is showing, or the wedges would stop matching the
     winner under the pointer. Deferred changes land when the card closes. */
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; } /* initial pick came from useState */
    if (spinning || result) { dirtyRef.current = true; return; }
    setWheel(pickWheelTrips(eligible, WHEEL_MAX));
  }, [eligible]); // eslint-disable-line react-hooks/exhaustive-deps
  const closeResult = () => {
    setResult(null);
    if (dirtyRef.current) { dirtyRef.current = false; setWheel(pickWheelTrips(eligible, WHEEL_MAX)); }
  };

  const liveOnWheel = wheel.filter((t) => t.priceSource === "live").length;
  const spinsLeft = status ? status.left : 0;
  const outOfSpins = status ? status.left <= 0 : false;
  const canBank = status?.mode === "server";

  /* ---------- sound ---------- */
  const tone = useCallback((freq, dur, vol, type = "square") => {
    if (muted) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = (audioRef.current ||= new AC());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = freq; o.type = type;
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch {}
  }, [muted]);

  /* ---------- draw ---------- */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = SIZE * dpr; cv.height = SIZE * dpr;
    const cx = cv.getContext("2d");
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const C = SIZE / 2, RING = C - 12, RAD = C - 46;
    const n = wheel.length;
    cx.clearRect(0, 0, SIZE, SIZE);

    /* carnival ring + bulbs */
    cx.beginPath(); cx.arc(C, C, RING, 0, Math.PI * 2); cx.fillStyle = T.ink; cx.fill();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      cx.beginPath();
      cx.arc(C + Math.cos(a) * (RING - 16), C + Math.sin(a) * (RING - 16), 7, 0, Math.PI * 2);
      cx.fillStyle = i % 2 ? T.sun : "#5a5d73";
      cx.fill();
    }

    if (n === 0) {
      cx.beginPath(); cx.arc(C, C, RAD, 0, Math.PI * 2); cx.fillStyle = T.white; cx.fill();
      cx.strokeStyle = T.ink; cx.lineWidth = 8; cx.stroke();
      cx.fillStyle = T.ink; cx.textAlign = "center";
      cx.font = "800 44px 'Bricolage Grotesque', sans-serif";
      cx.fillText("nothing in budget yet", C, C + 10);
      return;
    }

    const arc = (Math.PI * 2) / n;
    cx.save(); cx.translate(C, C);
    for (let i = 0; i < n; i++) {
      const t = wheel[i], a0 = i * arc;
      cx.beginPath(); cx.moveTo(0, 0); cx.arc(0, 0, RAD, a0, a0 + arc); cx.closePath();
      cx.fillStyle = PALETTE[i % PALETTE.length]; cx.fill();
      cx.strokeStyle = T.ink; cx.lineWidth = 5; cx.stroke();

      cx.save(); cx.rotate(a0 + arc / 2);
      cx.textAlign = "center"; cx.fillStyle = T.ink;
      const nameSize = n <= 6 ? 46 : n <= 9 ? 38 : 32;
      const priceSize = n <= 6 ? 40 : n <= 9 ? 34 : 29;
      const emSize = n <= 6 ? 62 : n <= 9 ? 52 : 44;

      cx.font = `${emSize}px sans-serif`;
      cx.fillText(t.img, RAD - emSize * 0.8, emSize * 0.32);

      /* Long names would collide with the hub, so squeeze rather than clip. */
      cx.font = `800 ${nameSize}px 'Bricolage Grotesque', sans-serif`;
      const maxName = RAD * 0.62;
      cx.fillText(t.name, RAD * 0.52, -nameSize * 0.2, maxName);

      cx.font = `800 ${priceSize}px 'Bricolage Grotesque', sans-serif`;
      cx.fillStyle = T.cobalt;
      cx.fillText(fmt(t.cost), RAD * 0.52, priceSize * 0.95, maxName);
      cx.restore();
    }
    cx.restore();
    cx.beginPath(); cx.arc(C, C, RAD, 0, Math.PI * 2); cx.strokeStyle = T.ink; cx.lineWidth = 10; cx.stroke();
  }, [wheel, fontsReady]);

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); clearTimeout(timeoutRef.current); }, []);

  /* ---------- spin ---------- */
  const animateTo = (pool, winner, onLanded) => {
    const n = pool.length;
    /* pointer sits at 12 o'clock; canvas 0rad is 3 o'clock */
    const arc = (Math.PI * 2) / n;
    const start = angleRef.current;
    const target = -Math.PI / 2 - (winner * arc + arc / 2);
    let delta = (target - (start % (Math.PI * 2))) % (Math.PI * 2);
    if (delta < 0) delta += Math.PI * 2;
    const total = delta + Math.PI * 2 * (5 + Math.floor(Math.random() * 3));
    const end = start + total;

    /* Single exit path, guarded so the rAF loop and the stall-safety timer
       below can never both land the same spin. */
    landedRef.current = false;
    const land = () => {
      if (landedRef.current) return;
      landedRef.current = true;
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timeoutRef.current);
      angleRef.current = end;
      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${end}rad)`;
      setAngle(end);
      setSpinning(false);
      onLanded();
      tone(523, 0.3, 0.1, "triangle");
      setTimeout(() => tone(659, 0.32, 0.1, "triangle"), 110);
      setTimeout(() => tone(784, 0.45, 0.1, "triangle"), 230);
    };

    if (reduced) { land(); return; }

    let t0 = 0, lastIdx = -1;
    const step = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min(1, (ts - t0) / SPIN_MS);
      const a = start + total * (1 - Math.pow(1 - p, 3));
      /* Written straight to the DOM: a setState per frame would re-render the
         whole view 60 times a second for a transform the compositor handles. */
      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${a}rad)`;
      angleRef.current = a;
      const idx = Math.floor(((((-Math.PI / 2 - a) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / arc);
      if (idx !== lastIdx) { tone(860 + Math.random() * 200, 0.03, 0.04); lastIdx = idx; }
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else land();
    };
    rafRef.current = requestAnimationFrame(step);

    /* rAF is paused in a backgrounded tab. Without this the button would sit
       disabled on "SPINNING…" until the tab is looked at again. */
    timeoutRef.current = setTimeout(land, SPIN_MS + 600);
  };

  const spin = async () => {
    if (spinning || wheel.length === 0 || !status || outOfSpins) return;
    const pool = wheel;
    lockedRef.current = pool;
    setSpinning(true);

    let winner, next;
    if (status.mode === "server") {
      try {
        const r = await fetch("/api/spins", {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ wheel: pool.map((t) => t.id) }),
        });
        const b = await r.json().catch(() => ({}));
        if (r.status === 429 && b.resetsAt) { setStatus({ mode: "server", ...b }); setSpinning(false); return; }
        if (!r.ok || typeof b.winner !== "number") throw new Error(`spin ${r.status}`);
        winner = b.winner;
        next = { mode: "server", ...b };
      } catch {
        /* server gone mid-session: this spin counts locally and banks nothing */
        const l = localStatus();
        if (l.left <= 0) { setStatus(l); setSpinning(false); return; }
        winner = Math.floor(Math.random() * pool.length);
        writeStore(LOCAL_KEY, { cycle: l.cycle, n: l.used + 1 });
        next = localStatus();
      }
    } else {
      winner = Math.floor(Math.random() * pool.length);
      writeStore(LOCAL_KEY, { cycle: status.cycle, n: status.used + 1 });
      next = localStatus();
    }
    setStatus(next);
    animateTo(pool, winner, () => setResult({ trip: pool[winner], bonus: next.mode === "server" ? next.bonus : 0 }));
  };

  const toggleMute = () => setMuted((v) => { writeStore("sendoff_spin_muted", !v); return !v; });

  const brico = "'Bricolage Grotesque', sans-serif";
  const resetsIn = status ? untilText(status.resetsAt) : "";

  return (
    <section style={{ maxWidth: 960, margin: "0 auto", padding: "18px 12px 40px", textAlign: "center" }}>
      <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: "clamp(27px, 6vw, 44px)",
        lineHeight: 1.15, letterSpacing: "-0.5px" }}>
        Can't decide?<br /><span style={{ color: T.cobalt }}>Spin. Pack. Go.</span>
      </h2>
      <p style={{ marginTop: 10, fontSize: 14.5, fontWeight: 600, opacity: 0.7, maxWidth: 500,
        marginLeft: "auto", marginRight: "auto" }}>
        Every send you can actually afford goes on the wheel. Where it stops is where you're going —
        no takebacks, that's the rule.
      </p>

      {eligible.length === 0 ? (
        <div style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: R.card,
          boxShadow: SH.card, padding: "34px 22px", maxWidth: 420, margin: "28px auto 0" }}>
          <div style={{ fontSize: 44 }}>🫠</div>
          <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 21, marginTop: 8 }}>
            Nothing fits that budget yet
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, opacity: 0.65, marginTop: 8 }}>
            Nudge the budget up on THE TRIPS tab and the wheel fills right back up.
          </p>
        </div>
      ) : (
        <>
          {/* ---- wheel ---- */}
          {/* zIndex 0 + isolate pins the wheel to its own stacking context at the
              floor. Spinning promotes the canvas to a compositor layer, and
              without this an overlay can end up painted beneath it.
              Capped on viewport height as well as width so a short laptop window
              doesn't push the spin button miles below the fold. */}
          <div style={{ position: "relative", width: "min(96vw, 600px, 60vh)", margin: "14px auto 0",
            aspectRatio: "1 / 1", zIndex: 0, isolation: "isolate" }}>
            {/* pointer */}
            <div aria-hidden style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)",
              width: 0, height: 0, borderLeft: "17px solid transparent", borderRight: "17px solid transparent",
              borderTop: `30px solid ${T.poppy}`, filter: `drop-shadow(0 3px 0 ${T.ink})`, zIndex: 4 }} />

            {/* The wheel rests exactly where it landed, so the winning wedge stays
                under the pointer. No idle animation: a CSS keyframe here would
                override this transform and drift off the result. */}
            <div ref={wheelRef} style={{ width: "100%", height: "100%", transform: `rotate(${angle}rad)`,
              willChange: spinning ? "transform" : "auto" }}>
              <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
            </div>

            {/* hub */}
            <div aria-hidden style={{ position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)", width: "21%", height: "21%", borderRadius: "50%",
              background: T.sun, border: `4px solid ${T.ink}`, boxShadow: `0 4px 0 ${T.ink}`, zIndex: 3,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 120 120" style={{ width: "62%", height: "62%" }}>
                <g transform="translate(18,16) rotate(-24 42 42)">
                  <path d="M 2 38 L 98 4 L 62 90 L 44 54 Z" fill={T.cobalt} stroke={T.ink} strokeWidth="8" strokeLinejoin="round" />
                  <path d="M 2 38 L 98 4 L 48 48 Z" fill="#4A66F6" stroke={T.ink} strokeWidth="8" strokeLinejoin="round" />
                </g>
              </svg>
            </div>
          </div>

          {/* ---- controls ---- */}
          <button onClick={spin} disabled={spinning || !status || outOfSpins}
            style={{ marginTop: 22, fontFamily: brico, fontWeight: 800, fontSize: "clamp(17px, 4.5vw, 21px)",
              padding: "16px 40px", minHeight: 56, borderRadius: 18, border: `3px solid ${T.ink}`,
              background: spinning || !status ? "#9aa2c9" : outOfSpins ? T.white : T.cobalt,
              color: outOfSpins && !spinning && status ? T.ink : T.white,
              cursor: spinning ? "wait" : outOfSpins ? "default" : "pointer", boxShadow: SH.big, letterSpacing: 0.4,
              maxWidth: "100%" }}>
            {spinning ? "SPINNING…" : !status ? "WARMING UP…" : outOfSpins ? `WHEEL'S BACK IN ${resetsIn.toUpperCase()}` : "SPIN THE SEND 🎡"}
          </button>

          <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "center",
            alignItems: "center", flexWrap: "wrap", fontSize: 13, fontWeight: 700, opacity: 0.6 }}>
            <span>
              {wheel.length} on the wheel
              {eligible.length > wheel.length && ` of ${eligible.length} in budget`} · from {origin}
              {liveOnWheel > 0 && ` · ${liveOnWheel} priced with live fares`}
            </span>
            <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 15,
                padding: 4, minWidth: 32, minHeight: 32 }}>
              {muted ? "🔇" : "🔊"}
            </button>
          </div>

          {/* The budget line. One clock for everybody: "resets in" is the same
              number on every phone, which is the whole point of it. */}
          {status && (
            <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 600, opacity: 0.55, lineHeight: 1.5 }}>
              {outOfSpins
                ? `All ${status.limit} spins used. Everyone's spins reset together in ${resetsIn}.`
                : `${spinsLeft} of ${status.limit} spins left · everyone resets in ${resetsIn}`}
              {canBank && (
                <><br />Book the trip the wheel picks and bank <b>+{status.bonus} Send Points</b>.</>
              )}
            </div>
          )}
        </>
      )}

      {/* ---- result ----
          Portalled to <body>: the spinning wheel sets will-change/transform,
          which creates a stacking context this overlay would otherwise be
          trapped beneath — the card renders under the wheel without it. */}
      {result && createPortal(
        <m.div onClick={closeResult} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          style={{ position: "fixed", inset: 0, background: "rgba(27,29,42,0.58)", zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <m.div onClick={(e) => e.stopPropagation()} initial={{ y: 18, scale: 0.94, opacity: 0.7 }}
            animate={{ y: 0, scale: 1, opacity: 1 }} transition={SPRING}
            style={{ background: T.paper, border: `2px solid ${T.ink}`, borderRadius: 22, boxShadow: SH.big,
              width: "100%", maxWidth: 400, maxHeight: "90vh", overflowY: "auto", padding: "28px 22px",
              textAlign: "center", color: T.ink }}>
            <div style={{ fontSize: 60, lineHeight: 1 }}>{result.trip.img}</div>
            <div style={{ fontFamily: brico, fontWeight: 800, fontSize: "clamp(23px, 6vw, 30px)",
              marginTop: 8, letterSpacing: "-0.4px" }}>
              {result.trip.name}
            </div>
            <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 22, color: T.cobalt, marginTop: 2 }}>
              {fmt(result.trip.cost)} / person
              <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.6, marginLeft: 6 }}>{priceTag(result.trip)}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.62, marginTop: 8 }}>
              {result.trip.days} days · {result.trip.tag} · from {origin} · {friends + 1} people
            </div>
            <div style={{ marginTop: 14, fontFamily: brico, fontWeight: 800, color: T.poppy,
              fontSize: 12.5, letterSpacing: 1.2 }}>
              THE WHEEL HAS SPOKEN · NO TAKEBACKS
            </div>
            {result.bonus > 0 && (
              <div style={{ marginTop: 12, background: T.sun, border: `2px solid ${T.ink}`, borderRadius: 12,
                padding: "9px 12px", fontSize: 13, fontWeight: 700 }}>
                🎯 Open a booking search for this one and <b>+{result.bonus} Send Points</b> are yours.
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={closeResult}
                style={{ flex: 1, fontFamily: brico, fontWeight: 800, fontSize: 15, padding: "14px 8px",
                  minHeight: 50, borderRadius: 14, border: `2px solid ${T.ink}`, background: T.white,
                  color: T.ink, cursor: "pointer", boxShadow: SH.card }}>
                {outOfSpins ? "maybe later 😅" : "spin again 😅"}
              </button>
              <button onClick={() => { const r = result; closeResult(); onPick?.(r.trip, { fromWheel: true, bonus: r.bonus }); }}
                style={{ flex: 1, fontFamily: brico, fontWeight: 800, fontSize: 15, padding: "14px 8px",
                  minHeight: 50, borderRadius: 14, border: `2px solid ${T.ink}`, background: T.sun,
                  color: T.ink, cursor: "pointer", boxShadow: SH.card }}>
                SEND IT →
              </button>
            </div>
          </m.div>
        </m.div>,
        document.body
      )}
    </section>
  );
}
