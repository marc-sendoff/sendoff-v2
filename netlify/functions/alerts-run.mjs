/* GET /api/alerts-run?key=<PLUS_ACCESS_CODE> — run the fare-alerts job now
   and return its summary, for checking alerts without waiting for ten past
   the hour. The throttle inside the job means a re-run never double-emails. */
import { run } from "./fare-alerts.mjs";
import { json } from "../lib/tp.mjs";

export default async (req) => {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.PLUS_ACCESS_CODE || key !== process.env.PLUS_ACCESS_CODE) return json({ ok: false, error: "no" }, 401);
  try { return json({ ok: true, ...(await run()) }); }
  catch (e) { return json({ ok: false, crashed: e.message, stack: String(e.stack).split("\n").slice(0, 4) }, 500); }
};

export const config = { path: "/api/alerts-run" };
