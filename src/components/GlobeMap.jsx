import React, { useState } from "react";
import { m } from "motion/react";
import { T, SH, SPRING } from "../theme.js";
import { TRIPS } from "../data/trips.js";
import { fmt } from "../data/config.js";
import { D2R, STARS3, CONTINENT_LABELS, COUNTRY_PINS } from "../data/mapdata.js";

/* Stylized continent outlines shown only for the instant before the accurate
   coastline data loads (or if both mirrors are unreachable). */
const FALLBACK_LAND = [
  [[71,-156],[70,-148],[69,-135],[70,-128],[68,-115],[69,-100],[68,-90],[64,-82],[60,-78],[55,-78],[51,-80],[55,-85],[57,-92],[60,-98],[58,-105],[58,-115],[52,-125],[49,-125],[43,-124],[40,-124],[37,-122],[34,-120],[31,-115],[28,-114],[23,-106],[19,-104],[16,-98],[16,-93],[19,-96],[23,-97],[26,-97],[29,-95],[30,-90],[30,-85],[26,-82],[25,-81],[30,-81],[34,-78],[38,-75],[41,-72],[44,-69],[46,-65],[48,-59],[51,-56],[55,-60],[60,-65],[64,-70],[68,-77],[71,-95],[71,-118]],
  [[83,-32],[81,-20],[75,-20],[70,-22],[64,-40],[60,-45],[65,-52],[71,-55],[78,-70],[81,-60]],
  [[12,-71],[9,-77],[2,-79],[-5,-81],[-12,-77],[-18,-71],[-25,-70],[-33,-72],[-41,-74],[-48,-75],[-55,-70],[-52,-69],[-45,-65],[-39,-62],[-35,-56],[-30,-50],[-24,-46],[-22,-41],[-15,-39],[-9,-35],[-5,-37],[-1,-44],[2,-50],[6,-57],[9,-62],[11,-68]],
  [[37,10],[33,13],[31,20],[31,32],[24,35],[18,38],[12,43],[9,49],[4,47],[-1,42],[-6,39],[-13,40],[-20,35],[-26,33],[-33,28],[-35,22],[-31,17],[-25,15],[-18,12],[-12,13],[-6,12],[0,9],[5,1],[5,-6],[9,-13],[15,-17],[21,-16],[26,-14],[31,-9],[35,-6],[37,1]],
  [[-12,49],[-16,50],[-21,48],[-25,45],[-23,44],[-18,44],[-14,47]],
  [[36,-6],[41,-9],[44,-2],[48,-4],[51,2],[55,8],[58,11],[62,5],[66,13],[70,20],[71,28],[68,35],[67,44],[70,58],[73,70],[76,92],[74,100],[72,120],[70,140],[66,160],[64,178],[60,170],[57,157],[51,157],[46,145],[42,135],[39,127],[35,126],[38,121],[32,121],[27,121],[22,114],[19,106],[13,109],[9,105],[13,101],[8,98],[15,97],[21,92],[19,84],[13,80],[8,77],[15,74],[22,70],[25,66],[25,62],[22,59],[17,55],[13,45],[18,41],[24,37],[29,35],[33,36],[36,32],[41,29],[45,37],[46,33],[41,26],[41,20],[45,13],[41,15],[38,16],[41,15],[45,9],[43,4],[41,0],[37,-2]],
  [[58,-5],[55,-1],[51,1],[50,-4],[54,-3],[58,-7]],
  [[66,-23],[65,-14],[63,-19],[64,-23]],
  [[45,142],[41,140],[35,140],[33,131],[33,129],[36,134],[40,140]],
  [[6,95],[0,102],[-6,106],[-8,114],[-4,104],[2,97]],
  [[7,117],[1,110],[-4,114],[0,118]],
  [[18,121],[12,121],[6,126],[12,124]],
  [[-1,131],[-6,138],[-10,148],[-6,141]],
  [[-11,132],[-15,141],[-24,153],[-32,153],[-38,146],[-35,138],[-32,131],[-34,118],[-28,114],[-22,114],[-17,123],[-12,130]],
  [[-34,173],[-39,177],[-43,173],[-46,167],[-41,172],[-37,175]],
  [[23,-84],[20,-75],[22,-78]],
  [[9,80],[6,81],[8,80]],
];

export default function GlobeMap({ trips = TRIPS, origin, originCoords, budget, vibe, done, onOpen }) {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  /* the canvas spin is not a motion component, so honor reduced-motion here:
     no auto-spin, no inertia glide — direct drag still works */
  const reduceMotion = React.useRef(
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const rot = React.useRef({ lon: -60, lat: 15 });
  const drag = React.useRef(null);
  const pinch = React.useRef(null);        /* two-finger zoom */
  const pinHits = React.useRef([]);
  const pauseUntil = React.useRef(0);      /* touching pauses auto-spin for 5s, then it resumes */
  const vel = React.useRef(0);             /* inertia: lon deg per ms, decays after release */
  const [zoom, setZoom] = useState(1);
  const geo = React.useRef(null);          /* accurate coastlines once loaded */

  React.useEffect(() => {
    let alive = true;
    /* bundled coastline rings ([[lat, lon], ...] per ring), precomputed by
       scripts/build-globe-data.mjs — no third-party fetch in production */
    (async () => {
      try {
        const rings = await (await fetch("/geo/world-rings.json")).json();
        if (alive && Array.isArray(rings) && rings.length) geo.current = rings;
      } catch (e) { /* globe falls back to the plain sphere */ }
    })();
    return () => { alive = false; };
  }, []);
  const zoomRef = React.useRef(1);
  const propsRef = React.useRef({ budget, vibe, origin, originCoords, done });
  React.useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  React.useEffect(() => { propsRef.current = { budget, vibe, origin, originCoords, done }; }, [budget, vibe, origin, originCoords, done]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = 0, last = performance.now();

    /* perf: the globe only animates while on screen — scrolled away, the
       rAF loop stops entirely instead of burning frames forever */
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(draw); }
    });
    io.observe(canvas);

    const draw = (now) => {
      if (!visible) { raf = 0; return; }
      const dt = Math.min(48, now - last); last = now;
      if (!drag.current && !reduceMotion.current) {
        if (vel.current !== 0) {
          /* inertia glide: keep spinning after a throw, exponential decay */
          rot.current.lon = (rot.current.lon + vel.current * dt) % 360;
          vel.current *= Math.pow(0.95, dt / 16.7);
          if (Math.abs(vel.current) < 0.003) vel.current = 0;
        } else if (now > pauseUntil.current) {
          rot.current.lon = (rot.current.lon + dt * 0.005) % 360;
        }
      }

      const wrap = wrapRef.current;
      const cssW = wrap ? wrap.clientWidth : 640;
      const cssH = Math.round(cssW * 0.78);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(cssW * dpr)) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        canvas.style.width = cssW + "px";
        canvas.style.height = cssH + "px";
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      /* space + stars: brand ink, stars kept quiet */
      ctx.fillStyle = "#14162A";
      ctx.fillRect(0, 0, cssW, cssH);
      for (const st of STARS3) {
        ctx.globalAlpha = st.o * 0.55;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(st.x * cssW, st.y * cssH, st.r * 0.8, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;

      const cx = cssW / 2, cy = cssH / 2;
      const R = Math.min(cssW, cssH) * 0.42 * zoomRef.current;
      const la0 = rot.current.lat * D2R, lo0 = rot.current.lon * D2R;
      const cosLat = Math.cos(la0), sinLat = Math.sin(la0);
      const cosLon = Math.cos(lo0), sinLon = Math.sin(lo0);

      /* rotate a model-space unit vector into view space */
      const rotate = (v) => {
        const x1 = v[0] * cosLon - v[2] * sinLon;
        const z1 = v[0] * sinLon + v[2] * cosLon;
        const y2 = v[1] * cosLat - z1 * sinLat;
        const z2 = v[1] * sinLat + z1 * cosLat;
        return [x1, y2, z2];
      };

      /* clean rim instead of the old hazy atmosphere band */
      ctx.strokeStyle = "rgba(126,150,255,0.35)"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(cx, cy, R + 4, 0, 6.283); ctx.stroke();

      /* ocean: deep cobalt-ink — the brand blue, not default-earth teal */
      const ocean = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.32, R * 0.1, cx, cy, R);
      ocean.addColorStop(0, "#2E4BD8");
      ocean.addColorStop(0.6, "#1D2F9E");
      ocean.addColorStop(1, "#131B54");
      ctx.fillStyle = ocean;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();

      /* barely-there lat/lon graticule so the sphere reads as a globe */
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 0.7;
      const arcPath = (fixed, isMeridian) => {
        ctx.beginPath(); let pen = false;
        for (let t = -180; t <= 180; t += 3) {
          if (isMeridian && (t < -88 || t > 88)) continue;
          const la = isMeridian ? t : fixed;
          const lo = isMeridian ? fixed : t;
          const rr = rotate([Math.cos(la * D2R) * Math.sin(lo * D2R), Math.sin(la * D2R), Math.cos(la * D2R) * Math.cos(lo * D2R)]);
          if (rr[2] <= 0) { pen = false; continue; }
          const X = cx + rr[0] * R, Y = cy - rr[1] * R;
          if (!pen) { ctx.moveTo(X, Y); pen = true; } else ctx.lineTo(X, Y);
        }
        ctx.stroke();
      };
      for (let lo = -180; lo < 180; lo += 30) arcPath(lo, true);
      for (let la = -60; la <= 60; la += 30) arcPath(la, false);
      ctx.restore();

      /* land: flat paper with ink coastlines — the site's print-map look
         (also cheaper than the old per-frame land gradient) */
      {
        const rings = geo.current || FALLBACK_LAND;
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.clip();
        ctx.fillStyle = "#F4F1E8";
        ctx.strokeStyle = "rgba(27,29,42,0.55)";
        ctx.lineWidth = 0.8;
        for (const ring of rings) {
          const pts = ring.map(([la, lo]) =>
            rotate([Math.cos(la * D2R) * Math.sin(lo * D2R), Math.sin(la * D2R), Math.cos(la * D2R) * Math.cos(lo * D2R)]));
          /* pass 1: fill — hidden points are clamped onto the horizon circle so the
             path stays closed and never draws chords across the face of the globe */
          let anyVisible = false, first = true;
          ctx.beginPath();
          for (const rr of pts) {
            let X, Y;
            if (rr[2] <= 0) {
              const m = Math.hypot(rr[0], rr[1]) || 1e-6;
              X = cx + (rr[0] / m) * R; Y = cy - (rr[1] / m) * R;
            } else {
              anyVisible = true;
              X = cx + rr[0] * R; Y = cy - rr[1] * R;
            }
            if (first) { ctx.moveTo(X, Y); first = false; } else ctx.lineTo(X, Y);
          }
          if (!anyVisible) continue;
          ctx.closePath(); ctx.fill();
          /* pass 2: coastline stroke — breaks at the horizon so no rim lines */
          ctx.beginPath();
          let pen = false;
          for (const rr of pts) {
            if (rr[2] <= 0) { pen = false; continue; }
            const X = cx + rr[0] * R, Y = cy - rr[1] * R;
            if (!pen) { ctx.moveTo(X, Y); pen = true; } else ctx.lineTo(X, Y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      /* soft limb shading for roundness — much lighter than before */
      const shade = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.34, R * 0.15, cx, cy, R);
      shade.addColorStop(0, "rgba(255,255,255,0.10)");
      shade.addColorStop(0.6, "rgba(0,0,0,0)");
      shade.addColorStop(1, "rgba(10,10,30,0.32)");
      ctx.fillStyle = shade;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();

      /* project a lat/lon to screen, or null if hidden */
      const project = (lat, lon) => {
        const la = lat * D2R, lo = lon * D2R;
        const v = [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
        const r = rotate(v);
        if (r[2] <= 0.02) return null;
        return [cx + r[0] * R, cy - r[1] * R];
      };

      const { budget: bd, vibe: vb, origin: og, originCoords: oc, done: dn } = propsRef.current;
      const z = zoomRef.current;

      /* labels */
      ctx.textAlign = "center";
      if (z < 1.6) {
        ctx.font = "800 10.5px 'Instrument Sans', sans-serif";
        for (const [name, la, lo] of CONTINENT_LABELS) {
          const p = project(la, lo); if (!p) continue;
          ctx.lineWidth = 3; ctx.strokeStyle = "rgba(19,27,84,0.55)";
          ctx.strokeText(name, p[0], p[1]);
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          ctx.fillText(name, p[0], p[1]);
        }
      } else {
        ctx.font = "800 9px 'Instrument Sans', sans-serif";
        for (const [name, la, lo] of COUNTRY_PINS) {
          const p = project(la, lo); if (!p) continue;
          ctx.lineWidth = 2.4; ctx.strokeStyle = "rgba(244,241,232,0.85)";
          ctx.strokeText(name, p[0], p[1]);
          ctx.fillStyle = "rgba(27,29,42,0.9)";
          ctx.fillText(name, p[0], p[1]);
        }
      }

      /* trip pins. Far out (z < 1.6): tiny uniform sun-gold dots — the old
         per-trip candy colors + glow halos turned dense regions into noise.
         Zoomed in: colors and labels come back, because there's room. */
      pinHits.current = [];
      const far = z < 1.6;
      for (const t of trips) {
        const p = project(t.lat, t.lon); if (!p) continue;
        const ok = t.cost <= bd * 1.15 && (vb === "all" || t.vibes.includes(vb));
        const isDone = dn && dn.indexOf(t.id) !== -1;
        if (far) {
          ctx.globalAlpha = ok ? 0.95 : 0.22;
          ctx.beginPath(); ctx.arc(p[0], p[1], isDone ? 3.2 : 2.6, 0, 6.283);
          ctx.fillStyle = isDone ? "#2BA84A" : "#FFC93C"; ctx.fill();
          ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(27,29,42,0.8)"; ctx.stroke();
        } else {
          ctx.globalAlpha = ok ? 1 : 0.3;
          ctx.beginPath(); ctx.arc(p[0], p[1], isDone ? 7 : 5.5, 0, 6.283);
          ctx.fillStyle = isDone ? "#2BA84A" : t.color; ctx.fill();
          ctx.lineWidth = isDone ? 1.6 : 1.2; ctx.strokeStyle = isDone ? "#0B3D1C" : "#1B1D2A"; ctx.stroke();
          if (isDone) {
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.8; ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(p[0] - 3.1, p[1] + 0.2);
            ctx.lineTo(p[0] - 0.9, p[1] + 2.6);
            ctx.lineTo(p[0] + 3.3, p[1] - 2.6);
            ctx.stroke();
            ctx.lineCap = "butt";
          }
          if (z >= 2 && ok) {
            ctx.font = "800 9px 'Instrument Sans', sans-serif";
            ctx.lineWidth = 2.6; ctx.strokeStyle = "#14162A";
            const label = t.name.split(",")[0] + " " + fmt(t.cost);
            ctx.strokeText(label, p[0], p[1] - 11);
            ctx.fillStyle = "#fff"; ctx.fillText(label, p[0], p[1] - 11);
          }
        }
        ctx.globalAlpha = 1;
        pinHits.current.push({ t, x: p[0], y: p[1] });
      }

      /* home city */
      if (oc) {
        const p = project(oc[0], oc[1]);
        if (p) {
          ctx.beginPath(); ctx.arc(p[0], p[1], 7.5, 0, 6.283);
          ctx.fillStyle = T.poppy; ctx.fill();
          ctx.lineWidth = 1.6; ctx.strokeStyle = "#05070F"; ctx.stroke();
          ctx.font = "800 11px 'Bricolage Grotesque', sans-serif";
          ctx.lineWidth = 3; ctx.strokeStyle = "#05070F";
          ctx.strokeText(og.toUpperCase(), p[0], p[1] - 13);
          ctx.fillStyle = "#fff"; ctx.fillText(og.toUpperCase(), p[0], p[1] - 13);
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  const startDrag = (e) => {
    pauseUntil.current = performance.now() + 5000;  /* any touch pauses auto-spin for 5s */
    if (e.touches && e.touches.length === 2) {
      const [a, b] = e.touches;
      pinch.current = { d0: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z0: zoomRef.current };
      drag.current = null;
      vel.current = 0;
      return;
    }
    const p = e.touches ? e.touches[0] : e;
    vel.current = 0;            /* grabbing the globe cancels any inertia glide */
    drag.current = { x: p.clientX, y: p.clientY, lon: rot.current.lon, lat: rot.current.lat,
      moved: false, px: p.clientX, pt: performance.now() };
  };
  const onDrag = (e) => {
    if (pinch.current && e.touches && e.touches.length === 2) {
      const [a, b] = e.touches;
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const z = Math.max(1, Math.min(3, +(pinch.current.z0 * d / pinch.current.d0).toFixed(2)));
      setZoom(z);
      e.preventDefault();
      return;
    }
    if (!drag.current) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - drag.current.x, dy = p.clientY - drag.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true;
    const s = 0.35 / zoomRef.current;   /* finer control when zoomed in */
    /* negative: the surface follows the cursor (drag left -> view goes left) */
    rot.current.lon = drag.current.lon - dx * s;
    rot.current.lat = Math.max(-80, Math.min(80, drag.current.lat + dy * (0.3 / zoomRef.current)));
    const now = performance.now(), dtm = now - drag.current.pt;
    if (dtm > 0) {
      const inst = (-(p.clientX - drag.current.px) * s) / dtm;  /* deg per ms */
      vel.current = Math.max(-1.5, Math.min(1.5, vel.current * 0.2 + inst * 0.8));
      drag.current.px = p.clientX; drag.current.pt = now;
    }
    if (e.touches) e.preventDefault();
  };
  const endDrag = (e) => {
    pinch.current = null;
    pauseUntil.current = performance.now() + 5000;  /* 5s pause counts from release */
    const d = drag.current;
    const wasDrag = d && d.moved;
    drag.current = null;
    /* a tap, or a drag held still before release, releases with no throw */
    if (!wasDrag || (d && performance.now() - d.pt > 120)) vel.current = 0;
    if (wasDrag || !e || !d) return;
    const p = e.changedTouches ? e.changedTouches[0] : e;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = p.clientX - rect.left, my = p.clientY - rect.top;
    let best = null, bd = 16;
    for (const h of pinHits.current) {
      const dd = Math.hypot(h.x - mx, h.y - my);
      if (dd < bd) { bd = dd; best = h.t; }
    }
    if (best) onOpen(best);
  };

  const btn = {
    width: 54, height: 54, borderRadius: 14, border: `2px solid ${T.ink}`, background: T.white,
    fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 24, cursor: "pointer",
    boxShadow: `2px 2px 0 ${T.ink}`, color: T.ink, lineHeight: 1, touchAction: "manipulation",
  };

  /* live tie-in to the filters above: how many pins are lit right now */
  const litCount = trips.filter((t) => t.cost <= budget * 1.15 && (vibe === "all" || t.vibes.includes(vibe))).length;

  const legendDot = (bg, extra) => ({ width: 11, height: 11, borderRadius: "50%", background: bg,
    border: `1.5px solid ${T.ink}`, display: "inline-block", flexShrink: 0, ...extra });
  const legendChip = { display: "flex", alignItems: "center", gap: 6, background: T.white,
    border: `2px solid ${T.ink}`, borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 700,
    color: T.ink, whiteSpace: "nowrap", flexShrink: 0 };

  return (
    <section style={{ maxWidth: 960, margin: "34px auto 0", padding: "0 20px" }}>
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}
        style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" }}>THE GLOBE 🌍</h2>
        <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.6 }}>
          drag to spin · {litCount} {litCount === 1 ? "send lights" : "sends light"} up from {origin}
        </span>
      </m.div>

      <m.div ref={wrapRef} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.05 }}
        style={{ position: "relative", background: "#05070F", border: `2px solid ${T.ink}`,
          borderRadius: 20, boxShadow: SH.big, overflow: "hidden", lineHeight: 0 }}>
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 5, display: "flex", flexDirection: "column", gap: 10 }}>
          <m.button whileTap={{ scale: 0.92 }} transition={SPRING} onClick={() => setZoom((z) => Math.min(3, +(z + 0.5).toFixed(1)))} style={btn} title="Zoom in" aria-label="Zoom in">+</m.button>
          <m.button whileTap={{ scale: 0.92 }} transition={SPRING} onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))} style={btn} title="Zoom out" aria-label="Zoom out">−</m.button>
          <m.button whileTap={{ scale: 0.92 }} transition={SPRING} onClick={() => { setZoom(1); rot.current.lat = 15; }} style={{ ...btn, fontSize: 20 }} title="Reset" aria-label="Reset view">⤾</m.button>
        </div>
        <canvas ref={canvasRef}
          onMouseDown={startDrag} onMouseMove={onDrag} onMouseUp={endDrag} onMouseLeave={() => { drag.current = null; }}
          onTouchStart={startDrag} onTouchMove={onDrag} onTouchEnd={endDrag}
          style={{ display: "block", width: "100%", touchAction: "none", cursor: "grab" }} />
      </m.div>
      {/* legend: what the pin colors mean, one calm row that scrolls on phones */}
      <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.1 }}
        style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <span style={legendChip}><span style={legendDot(T.poppy)} /> {origin} — home base</span>
        <span style={legendChip}><span style={legendDot(T.sun)} /> a send in budget</span>
        <span style={legendChip}><span style={legendDot(T.sun, { opacity: 0.3 })} /> over budget</span>
        <span style={legendChip}><span style={legendDot("#2BA84A")} /> ✅ you did it</span>
      </m.div>
      <p style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.55, marginTop: 10 }}>
        Drag to spin it. Pinch or + / − to zoom. Tap a pin to open the trip.
      </p>
    </section>
  );
}
