import React, { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { T, SPRING } from "../theme.js";

/* One-time launch splash. Shows once per browser session (sessionStorage),
   auto-dismisses after ~1.8s, and any click/tap dismisses it immediately.
   If storage is blocked we still show it once — we just can't remember.
   Pure DOM + inline SVG: no images, no new deps, and it unmounts fully. */

const KEY = "sendoff-welcomed";

const alreadyWelcomed = () => {
  try { return window.sessionStorage.getItem(KEY) === "1"; }
  catch (e) { return false; } /* storage blocked → show it once anyway */
};

const prefersReducedMotion = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  catch (e) { return false; }
};

/* The brand plane from the logo, kept inline so the splash stays decoupled. */
function Plane({ size = 64 }) {
  return (
    <svg viewBox="0 0 90 84" width={size} height={size * 0.93} aria-hidden="true" style={{ display: "block" }}>
      <g transform="translate(2,2)">
        <path d="M 2 32 L 82 3 L 52 76 L 37 46 Z" fill={T.cobalt} stroke={T.ink} strokeWidth="5" strokeLinejoin="round" />
        <path d="M 2 32 L 82 3 L 40 40 Z" fill="#4A66F6" stroke={T.ink} strokeWidth="5" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default function WelcomeSplash() {
  const [show, setShow] = useState(() => !alreadyWelcomed());
  const [reduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (!show) return undefined;
    try { window.sessionStorage.setItem(KEY, "1"); } catch (e) {}
    const t = setTimeout(() => setShow(false), reduced ? 1200 : 1800);
    return () => clearTimeout(t);
  }, [show, reduced]);

  const fade = reduced
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, y: -24 }, transition: { duration: 0.4, ease: "easeOut" } };

  return (
    <AnimatePresence>
      {show && (
        <m.div key="sendoff-splash" {...fade} onClick={() => setShow(false)}
          role="status" aria-label="Welcome to Sendoff"
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: T.paper, color: T.ink,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 18, cursor: "pointer", overflow: "hidden", textAlign: "center", padding: 24 }}>

          {/* the plane glides in along a dotted flight line */}
          <div style={{ position: "relative", width: "min(420px, 80vw)", height: 84 }}>
            <svg viewBox="0 0 420 84" width="100%" height="100%" aria-hidden="true"
              style={{ position: "absolute", inset: 0 }}>
              <path d="M 10 66 L 240 66 Q 320 66 386 22" fill="none" stroke={T.sun}
                strokeWidth="7" strokeLinecap="round" strokeDasharray="2 18" />
            </svg>
            <m.div
              initial={reduced ? false : { x: -140, y: 30, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              transition={reduced ? { duration: 0 } : { ...SPRING, delay: 0.1 }}
              style={{ position: "absolute", right: 6, top: -18, transform: "rotate(-24deg)" }}>
              <Plane size={62} />
            </m.div>
          </div>

          <m.h1
            initial={reduced ? false : { y: 26, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={reduced ? { duration: 0 } : { ...SPRING, delay: 0.05 }}
            style={{ fontFamily: "'Bricolage Grotesque', 'Arial Black', sans-serif", fontWeight: 800,
              fontSize: "clamp(34px, 8vw, 72px)", letterSpacing: "-2px", lineHeight: 1.05, margin: 0 }}>
            WELCOME TO SENDOFF
          </m.h1>

          <div style={{ display: "inline-block", background: T.sun, border: `2px solid ${T.ink}`,
            borderRadius: 999, boxShadow: `4px 4px 0 ${T.shadow}`, padding: "10px 22px",
            fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700, fontSize: "clamp(15px, 3vw, 19px)" }}>
            Go while you're young ✈️
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
