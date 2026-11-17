import React, { useEffect, useRef } from "react";
import { T } from "../theme.js";

/* Holiday season dressing (see holidayOn in data/config.js).
   Snow: one fixed canvas behind nothing and in front of everything, no
   pointer events, ~70 pale-blue flakes so they read on the cream paper.
   Pauses off-screen and respects reduced motion. */
export function Snow() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = c.getContext("2d");
    let w = 0, h = 0, raf = 0, flakes = [], last = 0;
    const N = window.innerWidth < 600 ? 45 : 80;
    const mk = (top) => ({ x: Math.random() * w, y: top ? -10 : Math.random() * h, r: 1.2 + Math.random() * 2.4,
      v: 18 + Math.random() * 30, d: Math.random() * 6.283, s: 0.4 + Math.random() * 0.6, big: Math.random() < 0.12 });
    const size = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; flakes = Array.from({ length: N }, () => mk(false)); };
    size(); window.addEventListener("resize", size);
    const tick = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += f.v * dt * f.s; f.d += dt * 0.8; f.x += Math.sin(f.d) * 12 * dt;
        if (f.y > h + 10) Object.assign(f, mk(true));
        ctx.globalAlpha = 0.35 + f.s * 0.4;
        if (f.big) {
          ctx.font = `${8 + f.r * 3}px serif`; ctx.fillStyle = "#8FA6FF"; ctx.textAlign = "center";
          ctx.fillText("❄", f.x, f.y);
        } else {
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fillStyle = "#B8C6FF"; ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    const vis = () => { if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(tick); } };
    document.addEventListener("visibilitychange", vis);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); document.removeEventListener("visibilitychange", vis); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 150 }} />;
}

/* A string of lights along the very top of the page. */
export function Lights() {
  const colors = ["#FF5A3C", "#2BA84A", T.sun, T.cobalt, "#FF5A3C", "#F2E8FF"];
  const n = 40;
  return (
    <div aria-hidden="true" style={{ position: "relative", height: 14, overflow: "hidden", background: T.ink }}>
      <style>{`@keyframes sendoff-twinkle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.8)}}`}</style>
      <svg width="100%" height="14" viewBox={`0 0 ${n * 26} 14`} preserveAspectRatio="none" style={{ display: "block" }}>
        <path d={`M 0 3 ${Array.from({ length: n }, (_, i) => `Q ${i * 26 + 13} 9 ${(i + 1) * 26} 3`).join(" ")}`} fill="none" stroke="#3A3D52" strokeWidth="1.5" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "space-around", alignItems: "flex-end", padding: "0 6px 1px" }}>
        {Array.from({ length: n }, (_, i) => (
          <span key={i} style={{ width: 7, height: 9, borderRadius: "40% 40% 55% 55%", background: colors[i % colors.length],
            boxShadow: `0 0 6px ${colors[i % colors.length]}`, animation: `sendoff-twinkle ${1.6 + (i % 5) * 0.35}s ease-in-out ${(i % 7) * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );
}
