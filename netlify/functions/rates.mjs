/* GET /api/rates — USD exchange rates for display, written by the fare
   puller once per rotation. 404 until the first pull; the app stays in USD. */
import { getStore } from "@netlify/blobs";
import { json } from "../lib/tp.mjs";

export default async () => {
  const doc = await getStore("fares").get("rates", { type: "json" }).catch(() => null);
  if (!doc?.rates) return json({ ok: false, error: "no rates yet" }, 404);
  return json({ ok: true, ...doc }, 200, { "Cache-Control": "public, max-age=3600" });
};

export const config = { path: "/api/rates" };
