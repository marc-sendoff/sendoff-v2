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

/* A fireplace with stockings for the headline corner. The flames flicker
   and a few sparks drift up. Sized to stay inside the headline band. */
export function Fireplace({ width = 230 }) {
  const bricks = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 6; c++) {
    const off = r % 2 ? 40 : 0; const x = 60 + c * 80 + off, y = 100 + r * 40;
    if (x + 76 > 60 && x < 540) bricks.push(<rect key={r + "-" + c} x={Math.max(60, x)} y={y} width={Math.min(76, 540 - Math.max(60, x))} height="34" rx="3" fill="#C4553A" />);
  }
  const Stocking = ({ x, color = "#E3342F", letter }) => (
    <g transform={`translate(${x},88)`}>
      <path d="M -26 0 L 26 0 L 26 70 Q 26 92 46 100 L 64 108 Q 80 116 72 132 Q 64 146 44 142 L -8 128 Q -26 122 -26 100 Z" fill={color} stroke={T.ink} strokeWidth="6" strokeLinejoin="round" />
      <rect x="-32" y="-6" width="64" height="30" rx="8" fill="#fff" stroke={T.ink} strokeWidth="6" />
      {letter && <text x="0" y="72" textAnchor="middle" fontFamily="'Bricolage Grotesque',sans-serif" fontWeight="800" fontSize="30" fill="#fff">{letter}</text>}
    </g>
  );
  return (
    <svg className="holiday-tree" viewBox="40 40 520 440" width={width} aria-hidden="true" style={{ overflow: "visible" }}>
      <style>{`@keyframes sendoff-flame{0%,100%{transform:scaleY(1) scaleX(1)}30%{transform:scaleY(1.12) scaleX(.94) translateX(4px)}60%{transform:scaleY(.94) scaleX(1.06) translateX(-4px)}}
        @keyframes sendoff-glow{0%,100%{opacity:.55}50%{opacity:.85}}
        @keyframes sendoff-spark{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(-120px);opacity:0}}
        .fl{transform-origin:300px 420px;animation:sendoff-flame 1.1s ease-in-out infinite}
        .fl2{animation-duration:.8s;animation-delay:-.3s}.fl3{animation-duration:1.4s;animation-delay:-.6s}
        .gl{animation:sendoff-glow 1.3s ease-in-out infinite}
        .sp{animation:sendoff-spark 1.6s linear infinite}`}</style>
      {/* body and mantel */}
      <rect x="60" y="96" width="480" height="380" fill="#B5462A" stroke={T.ink} strokeWidth="7" />
      {bricks}
      <rect x="40" y="56" width="520" height="44" rx="8" fill="#fff" stroke={T.ink} strokeWidth="7" />
      {/* firebox */}
      <path d="M 160 440 L 160 220 Q 160 160 220 160 L 380 160 Q 440 160 440 220 L 440 440 Z" fill="#14162A" stroke={T.ink} strokeWidth="7" />
      <ellipse className="gl" cx="300" cy="400" rx="120" ry="70" fill="#FF8A3C" opacity="0.6" />
      {/* logs */}
      <rect x="200" y="404" width="200" height="30" rx="15" fill="#7A4A26" stroke={T.ink} strokeWidth="6" transform="rotate(-8 300 419)" />
      <rect x="200" y="404" width="200" height="30" rx="15" fill="#8B5A2B" stroke={T.ink} strokeWidth="6" transform="rotate(8 300 419)" />
      {/* flames */}
      <path className="fl" d="M 300 250 Q 360 300 350 370 Q 345 410 300 420 Q 255 410 250 370 Q 240 300 300 250 Z" fill="#FF5A3C" stroke={T.ink} strokeWidth="6" strokeLinejoin="round" />
      <path className="fl fl2" d="M 300 300 Q 340 335 335 380 Q 330 410 300 418 Q 270 410 265 380 Q 260 335 300 300 Z" fill={T.sun} />
      <path className="fl fl3" d="M 300 345 Q 320 365 318 390 Q 315 410 300 414 Q 285 410 282 390 Q 280 365 300 345 Z" fill="#FFF3B0" />
      {/* sparks */}
      {[[270, 0], [330, 0.5], [300, 1.0]].map(([x, d], i) => (
        <circle key={i} className="sp" cx={x} cy="300" r="5" fill={T.sun} style={{ animationDelay: `${d}s` }} />
      ))}
      {/* stockings on the mantel */}
      <Stocking x={120} letter="S" />
      <Stocking x={300} color={T.cobalt} />
      <Stocking x={480} color="#2BA84A" />
      <rect x="150" y="440" width="300" height="36" fill="#14162A" stroke={T.ink} strokeWidth="7" />
    </svg>
  );
}
