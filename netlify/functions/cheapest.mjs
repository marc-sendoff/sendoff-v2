/* GET /api/cheapest?origin=MIA&crew=4
   Ranks every flyable trip by fare + on-the-ground budget per person, using
   the latest pull for that origin. The response shape is the frozen contract
   src/utils/cheapest.js expects; 404 when there is no pull yet, so the UI
   falls back to its fixture (MIA) or hides the rail. */
import { getStore } from "@netlify/blobs";
import { readFileSync } from "node:fs";
import { buildResponse, IATA_RE } from "../lib/cheapest.js";
import { json } from "../lib/tp.mjs";

const TRIPS = JSON.parse(readFileSync(new URL("../data/trips-snapshot.json", import.meta.url), "utf8"));

export default async (req) => {
  const url = new URL(req.url);
  const origin = String(url.searchParams.get("origin") ?? "").toUpperCase();
  const crew = Number(url.searchParams.get("crew") ?? 1);
  if (!IATA_RE.test(origin)) return json({ ok: false, error: "origin must be a 3-letter code" }, 400);
  const doc = await getStore("fares").get(`fares/${origin}`, { type: "json" }).catch(() => null);
  if (!doc?.fares || !Object.keys(doc.fares).length) return json({ ok: false, error: "no fares for this origin yet" }, 404);
  const body = buildResponse({ origin, crew, trips: TRIPS, fares: doc.fares, updatedAt: doc.updatedAt });
  return json(body, 200, { "Cache-Control": "public, max-age=900" });
};

export const config = { path: "/api/cheapest" };
