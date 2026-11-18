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

/* A tree with presents for the headline corner. The ornaments are the lights:
   each blinks on its own timer. */
export function HolidayTree({ width = 230 }) {
  const lights = [
    [400,210,"#FF5A3C"],[500,190,"#2547F0"],[330,330,"#2547F0"],[470,330,"#FFC838"],[580,320,"#FF5A3C"],
    [260,450,"#FFC838"],[380,440,"#FF5A3C"],[520,455,"#2547F0"],[650,440,"#FFC838"],[450,110,"#FF5A3C"],[430,290,"#FF5A3C"],[560,420,"#F2E8FF"],
  ];
  return (
    <svg className="holiday-tree" viewBox="150 0 600 720" width={width} aria-hidden="true" style={{ overflow: "visible" }}>
      <style>{`@keyframes sendoff-blink{0%,100%{opacity:1;filter:drop-shadow(0 0 6px currentColor)}50%{opacity:.35;filter:none}}
        .hl{animation:sendoff-blink 1.4s ease-in-out infinite}`}</style>
      <ellipse cx="450" cy="690" rx="300" ry="30" fill="#fff" stroke={T.ink} strokeWidth="6" />
      <rect x="420" y="490" width="60" height="80" rx="8" fill="#8B5A2B" stroke={T.ink} strokeWidth="7" />
      <path d="M 450 60 L 300 270 L 600 270 Z" fill="#2BA84A" stroke={T.ink} strokeWidth="8" strokeLinejoin="round" />
      <path d="M 450 150 L 240 380 L 660 380 Z" fill="#2BA84A" stroke={T.ink} strokeWidth="8" strokeLinejoin="round" />
      <path d="M 450 250 L 180 500 L 720 500 Z" fill="#2BA84A" stroke={T.ink} strokeWidth="8" strokeLinejoin="round" />
      <path d="M 450 250 L 180 500 L 450 500 Z" fill="#1E8A3C" opacity="0.5" />
      <path d="M 450 150 L 240 380 L 450 380 Z" fill="#1E8A3C" opacity="0.5" />
      <path d="M 450 60 L 300 270 L 450 270 Z" fill="#1E8A3C" opacity="0.5" />
      <path d="M 330 250 Q 450 300 570 245" fill="none" stroke={T.sun} strokeWidth="10" strokeLinecap="round" />
      <path d="M 270 360 Q 450 420 630 355" fill="none" stroke={T.sun} strokeWidth="10" strokeLinecap="round" />
      <path d="M 215 480 Q 450 540 690 470" fill="none" stroke={T.sun} strokeWidth="10" strokeLinecap="round" />
      {lights.map(([x, y, c], i) => (
        <circle key={i} className="hl" cx={x} cy={y} r="15" fill={c} stroke={T.ink} strokeWidth="5"
          style={{ color: c, animationDelay: `${(i * 0.23) % 1.4}s`, animationDuration: `${1.1 + (i % 4) * 0.25}s` }} />
      ))}
      <path d="M 450 18 L 466 58 L 508 60 L 475 86 L 487 128 L 450 104 L 413 128 L 425 86 L 392 60 L 434 58 Z" fill={T.sun} stroke={T.ink} strokeWidth="7" strokeLinejoin="round" />
      {/* presents */}
      <g transform="translate(205,585)">
        <rect x="0" y="20" width="130" height="95" rx="12" fill={T.cobalt} stroke={T.ink} strokeWidth="7" />
        <rect x="53" y="20" width="24" height="95" fill={T.sun} stroke={T.ink} strokeWidth="5" />
        <rect x="0" y="52" width="130" height="22" fill={T.sun} stroke={T.ink} strokeWidth="5" />
        <circle cx="65" cy="20" r="13" fill={T.sun} stroke={T.ink} strokeWidth="6" />
      </g>
      <g transform="translate(360,600)">
        <rect x="0" y="20" width="150" height="85" rx="12" fill="#fff" stroke={T.ink} strokeWidth="7" />
        <rect x="63" y="20" width="24" height="85" fill="#E3342F" stroke={T.ink} strokeWidth="5" />
        <rect x="0" y="48" width="150" height="22" fill="#E3342F" stroke={T.ink} strokeWidth="5" />
        <circle cx="75" cy="20" r="13" fill="#E3342F" stroke={T.ink} strokeWidth="6" />
      </g>
      <g transform="translate(540,590)">
        <rect x="0" y="20" width="120" height="95" rx="12" fill={T.sun} stroke={T.ink} strokeWidth="7" />
        <rect x="48" y="20" width="24" height="95" fill="#FF5A3C" stroke={T.ink} strokeWidth="5" />
        <rect x="0" y="55" width="120" height="22" fill="#FF5A3C" stroke={T.ink} strokeWidth="5" />
        <circle cx="60" cy="20" r="13" fill="#FF5A3C" stroke={T.ink} strokeWidth="6" />
      </g>
    </svg>
  );
}
