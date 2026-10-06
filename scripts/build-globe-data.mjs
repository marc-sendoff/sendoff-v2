#!/usr/bin/env node
/* Regenerates public/geo/world-rings.json, the globe's coastline data.
   Source: johan/world.geo.json (public domain). Run when the source updates
   (it basically never does):
     curl -sL https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json -o /tmp/countries.geo.json
     node scripts/build-globe-data.mjs /tmp/countries.geo.json
   Output shape: [[[lat, lon], ...], ...] — the exact ring format GlobeMap
   draws, precomputed here so the client does zero flattening and no third
   party sees our visitors. Coords rounded to 2 decimals (~1 km), plenty for
   a canvas globe. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/build-globe-data.mjs countries.geo.json");
  process.exit(1);
}

const j = JSON.parse(readFileSync(src, "utf8"));
const rings = [];
for (const f of j.features) {
  const g = f.geometry;
  if (!g) continue;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  for (const poly of polys) {
    for (const ring of poly) {
      const pts = ring.map(([lo, la]) => [Math.round(la * 100) / 100, Math.round(lo * 100) / 100]);
      if (pts.length > 3) rings.push(pts);
    }
  }
}

mkdirSync("public/geo", { recursive: true });
writeFileSync("public/geo/world-rings.json", JSON.stringify(rings));
console.log(`${rings.length} rings written to public/geo/world-rings.json`);
