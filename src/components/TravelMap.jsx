import React, { useState } from "react";
import { T } from "../theme.js";
import { TRIPS } from "../data/trips.js";
import { fmt } from "../data/config.js";
import { MAP_W, MAP_H, proj, CONTINENTS, contPath, linePath, BORDERS, STATE_LINES, COUNTRY_LABELS, STATE_LABELS } from "../data/mapdata.js";

export default function TravelMap({ trips = TRIPS, origin, originCoords, budget, vibe, done, onOpen, onGlobe }) {
  const o = originCoords ? proj(originCoords[0], originCoords[1]) : null;

  /* --- zoom + pan --- */
  const [z, setZ] = useState(1);              // zoom factor (1 = whole world)
  const [c, setC] = useState([MAP_W / 2, MAP_H / 2]); // view center in map coords
  const svgRef = React.useRef(null);
  const drag = React.useRef(null);
  const pinch = React.useRef(null);
  const moved = React.useRef(false);       /* suppresses pin clicks at the end of a pan/pinch */

  const vw = MAP_W / z, vh = MAP_H / z;
  const clampC = (cx, cy, zz) => {
    const w = MAP_W / zz, h = MAP_H / zz;
    return [Math.min(MAP_W - w / 2, Math.max(w / 2, cx)), Math.min(MAP_H - h / 2, Math.max(h / 2, cy))];
  };
  const vb = `${c[0] - vw / 2} ${c[1] - vh / 2} ${vw} ${vh}`;
  const zoomTo = (nz, anchor) => {
    const zz = Math.min(8, Math.max(1, nz));
    if (anchor) {
      /* keep the anchor point stationary while zooming */
      const [ax, ay] = anchor;
      const k = 1 - z / zz;
      setC(clampC(c[0] + (ax - c[0]) * k, c[1] + (ay - c[1]) * k, zz));
    } else {
      setC((p) => clampC(p[0], p[1], zz));
    }
    setZ(zz);
  };
  /* screen px -> map coords */
  const toMap = (clientX, clientY) => {
    const r = svgRef.current.getBoundingClientRect();
    return [c[0] - vw / 2 + ((clientX - r.left) / r.width) * vw,
            c[1] - vh / 2 + ((clientY - r.top) / r.height) * vh];
  };
  const startDrag = (e) => {
    const p = e.touches ? e.touches[0] : e;
    moved.current = false;
    drag.current = { x: p.clientX, y: p.clientY, c: [...c] };
  };
  const moveDrag = (e) => {
    if (e.touches && e.touches.length === 2) {
      const [a, b] = e.touches;
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (pinch.current) zoomTo(z * (dist / pinch.current));
      pinch.current = dist;
      drag.current = null;
      moved.current = true;
      e.preventDefault();
      return;
    }
    if (!drag.current) return;
    const p = e.touches ? e.touches[0] : e;
    if (Math.abs(p.clientX - drag.current.x) + Math.abs(p.clientY - drag.current.y) > 4) moved.current = true;
    const r = svgRef.current.getBoundingClientRect();
    const dx = ((p.clientX - drag.current.x) / r.width) * vw;
    const dy = ((p.clientY - drag.current.y) / r.height) * vh;
    setC(clampC(drag.current.c[0] - dx, drag.current.c[1] - dy, z));
    if (e.touches) e.preventDefault();
  };
  const endDrag = () => { drag.current = null; pinch.current = null; };
  const reset = () => { setZ(1); setC([MAP_W / 2, MAP_H / 2]); };
  /* counter-scale pin text/strokes so they stay readable when zoomed in */
  const k = 1 / Math.sqrt(z);

  const btn = {
    width: 40, height: 40, borderRadius: 12, border: `2px solid ${T.ink}`, background: T.white,
    fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, cursor: "pointer",
    boxShadow: `2px 2px 0 ${T.shadow}`, color: T.ink, lineHeight: 1,
  };

  return (
    <section style={{ maxWidth: 960, margin: "34px auto 0", padding: "0 20px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>TRAVEL MAP 🗺️</h2>
        <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.6 }}>every send on Earth, from {origin}</span>
      </div>
      <div style={{ position: "relative", background: T.white, border: `2px solid ${T.ink}`, borderRadius: 20, boxShadow: `5px 5px 0 ${T.shadow}`, overflow: "hidden" }}>
        {/* zoom controls */}
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 5, display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => zoomTo(z * 1.5)} style={btn} aria-label="Zoom in">+</button>
          <button onClick={() => zoomTo(z / 1.5)} style={btn} aria-label="Zoom out">−</button>
          {z > 1 && <button onClick={reset} style={{ ...btn, fontSize: 15 }} aria-label="Reset view">⤢</button>}
          {onGlobe && <button onClick={onGlobe} style={{ ...btn, fontSize: 15 }} aria-label="Globe view">🌍</button>}
        </div>
        {z > 1 && (
          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 5, background: T.ink, color: T.paper,
            borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 800, fontFamily: "'Instrument Sans', sans-serif" }}>
            {z.toFixed(1)}×
          </div>
        )}
        <svg ref={svgRef} viewBox={vb}
          onMouseDown={startDrag} onMouseMove={moveDrag} onMouseUp={endDrag} onMouseLeave={endDrag}
          onTouchStart={startDrag} onTouchMove={moveDrag} onTouchEnd={endDrag}
          onDoubleClick={(e) => zoomTo(z * 1.8, toMap(e.clientX, e.clientY))}
          style={{ display: "block", width: "100%", height: "auto", cursor: z > 1 ? "grab" : "default", touchAction: "none" }}>
          {/* ocean */}
          <rect x={-MAP_W} y={-MAP_H} width={MAP_W * 3} height={MAP_H * 3} fill="#DFECF1" />
          {/* land */}
          {CONTINENTS.map((ct, i) => (
            <path key={"c" + i} d={contPath(ct)} fill="#F0EAD9" stroke={T.ink} strokeOpacity="0.3" strokeWidth={1.3 * k} strokeLinejoin="round" />
          ))}
          {/* Hawaii */}
          {(() => { const [hx, hy] = proj(20.7, -157.3); return <circle cx={hx} cy={hy} r="5" fill="#F0EAD9" stroke={T.ink} strokeOpacity="0.3" strokeWidth={1.3 * k} />; })()}
          {/* national borders */}
          {BORDERS.map((b, i) => (
            <path key={"b" + i} d={linePath(b)} fill="none" stroke={T.ink} strokeOpacity="0.28"
              strokeWidth={1.1 * k} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${3 * k} ${2.4 * k}`} />
          ))}
          {/* US state lines — fainter, thinner */}
          {STATE_LINES.map((s, i) => (
            <path key={"s" + i} d={linePath(s)} fill="none" stroke={T.ink} strokeOpacity="0.16"
              strokeWidth={0.8 * k} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {/* country names — appear once you zoom in a bit */}
          {z > 1.6 && COUNTRY_LABELS.map(([name, la, lo], i) => {
            const [x, y] = proj(la, lo);
            return (
              <text key={"cl" + i} x={x} y={y} textAnchor="middle"
                fontFamily="Instrument Sans, sans-serif" fontSize={10.5 * k} fontWeight="800"
                fill={T.ink} opacity="0.34" letterSpacing={1.6 * k}>
                {name}
              </text>
            );
          })}
          {/* state names — appear when zoomed further */}
          {z > 2.6 && STATE_LABELS.map(([name, la, lo], i) => {
            const [x, y] = proj(la, lo);
            return (
              <text key={"sl" + i} x={x} y={y} textAnchor="middle"
                fontFamily="Instrument Sans, sans-serif" fontSize={7 * k} fontWeight="700"
                fill={T.ink} opacity="0.28" letterSpacing={1.1 * k}>
                {name}
              </text>
            );
          })}
          {/* nautical grid */}
          {Array.from({ length: 16 }, (_, i) => (
            <line key={"v" + i} x1={(i + 1) * (MAP_W / 17)} y1="0" x2={(i + 1) * (MAP_W / 17)} y2={MAP_H} stroke={T.ink} strokeOpacity="0.05" strokeWidth={k} />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <line key={"h" + i} x1="0" y1={(i + 1) * (MAP_H / 12)} x2={MAP_W} y2={(i + 1) * (MAP_H / 12)} stroke={T.ink} strokeOpacity="0.05" strokeWidth={k} />
          ))}
          <text x="16" y={MAP_H - 16} fontFamily="Instrument Sans, sans-serif" fontSize={11 * k} fontWeight="700" fill={T.ink} opacity="0.4">
            not to scale · vibes are accurate
          </text>
          {o && trips.map((t) => {
            const [px, py] = proj(t.lat, t.lon);
            const nx = px + (t.nudge ? t.nudge[0] : 0), ny = py + (t.nudge ? t.nudge[1] : 0);
            const mx = (o[0] + nx) / 2, my = (o[1] + ny) / 2 - Math.min(80, Math.hypot(nx - o[0], ny - o[1]) * 0.16);
            const ok = t.cost <= budget * 1.15 && (vibe === "all" || t.vibes.includes(vibe));
            return <path key={"a" + t.id} d={`M ${o[0]} ${o[1]} Q ${mx} ${my} ${nx} ${ny}`} fill="none"
              stroke={ok ? T.cobalt : T.ink} strokeOpacity={ok ? 0.55 : 0.07} strokeWidth={1.6 * k} strokeDasharray={`${2 * k} ${6 * k}`} strokeLinecap="round" />;
          })}
          {trips.map((t) => {
            const [px, py] = proj(t.lat, t.lon);
            const x = px + (t.nudge ? t.nudge[0] : 0), y = py + (t.nudge ? t.nudge[1] : 0);
            const ok = t.cost <= budget * 1.15 && (vibe === "all" || t.vibes.includes(vibe));
            return (
              <g key={t.id} transform={`translate(${x},${y}) scale(${k})`} opacity={ok ? 1 : 0.22} style={{ cursor: "pointer" }}
                onClick={() => { if (!moved.current) onOpen(t); }}>
                {done && done.indexOf(t.id) !== -1 ? (
                  <g>
                    <circle r="12" fill="#2BA84A" stroke={T.ink} strokeWidth="2" />
                    <path d="M -5 0 L -1.6 3.6 L 5 -3.4" fill="none" stroke="#fff" strokeWidth="2.4"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                ) : (
                  <g>
                    <circle r="12" fill={t.color} stroke={T.ink} strokeWidth="2" />
                    <text textAnchor="middle" dy="4" fontSize="11">{t.img}</text>
                  </g>
                )}
                {(ok || z > 2) && (
                  <text textAnchor="middle" dy="26" fontFamily="Instrument Sans, sans-serif" fontSize="9" fontWeight="800" fill={T.ink}>
                    {t.name.split(",")[0].split(" +")[0]} {fmt(t.cost)}
                  </text>
                )}
              </g>
            );
          })}
          {o && (
            <g transform={`translate(${o[0]},${o[1]}) scale(${k})`}>
              <circle r="12" fill={T.poppy} stroke={T.ink} strokeWidth="2" />
              <text textAnchor="middle" dy="4" fontSize="11" fill={T.white} fontWeight="800">★</text>
              <text textAnchor="middle" dy="-18" fontFamily="Bricolage Grotesque, sans-serif" fontSize="12" fontWeight="800" fill={T.ink}>
                {origin.toUpperCase()}
              </text>
            </g>
          )}
        </svg>
        {!o && (
          <div style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700, borderTop: `2px dashed ${T.ink}33` }}>
            📍 Pick a city from the suggestions list to plot your home base + routes.
          </div>
        )}
      </div>
      <p style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.55, marginTop: 10 }}>
        Full-color pins fit your budget + vibe. Faded ones are out of reach — for now. Tap any pin to open the trip.
        Pinch or use + / − to zoom, drag to pan, double-tap to zoom in.
      </p>
    </section>
  );
}
