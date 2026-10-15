/* Travelpayouts cached-price API, shared by the fare puller and /api/fare.
   One endpoint, one auth style: the token goes in the X-Access-Token header,
   never in the URL, so it can't leak into a log line or an error. Every
   failure returns [] — a missing fare is fine, a crashed function is not. */
export const API = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates";
export const MAX_FARE = 100_000;
export const COMMON = { currency: "usd", market: "us", one_way: "false", direct: "false" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function token() {
  const t = process.env.TP_API_TOKEN;
  if (!t) throw new Error("TP_API_TOKEN is not set in the Netlify environment");
  return t;
}

export async function tpRows(params, { pace = 100 } = {}) {
  const u = new URL(API);
  for (const [k, v] of Object.entries({ ...COMMON, ...params })) u.searchParams.set(k, String(v));
  await sleep(pace); // the endpoint allows 600/min and punishes bursts with a lockout
  let res;
  try {
    res = await fetch(u, { headers: { "X-Access-Token": token() } });
  } catch (err) {
    console.error(`tp network error: ${err.message}`);
    return [];
  }
  if (res.status === 401) { console.error("tp 401: TP_API_TOKEN rejected"); return []; }
  if (res.status === 429) { console.error("tp 429: rate limited"); return []; }
  if (!res.ok) { console.error(`tp http ${res.status}`); return []; }
  const body = await res.json().catch(() => null);
  return Array.isArray(body?.data) ? body.data : [];
}

/* Cheapest row for one destination out of a result set; null if nothing sane. */
export function cheapestRow(rows, dest) {
  let best = null;
  for (const r of rows ?? []) {
    const price = Number(r?.price ?? r?.value);
    if (String(r?.destination ?? "").toUpperCase() !== dest) continue;
    if (!Number.isFinite(price) || price < 1 || price > MAX_FARE) continue;
    if (!best || price < best.price) best = { price: Math.round(price), row: r };
  }
  return best;
}

export const monthsAhead = (n) => {
  const out = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + i, 1));
    out.push(`${m.getUTCFullYear()}-${String(m.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
};

export const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extra },
  });
