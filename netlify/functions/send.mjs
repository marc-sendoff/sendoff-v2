/* /api/send — plan a send, invite the crew by link, RSVP, chat.
   GET  ?code=X[&token=T]            the send, its crew, the chat, and "me" if the token matches
   GET  ?mine=1 (bearer)             every send the signed-in user owns or is on
   POST {action:"create", ...}       (bearer) new send, returns {code, token}
   POST {action:"rsvp", code, name, contact?, status, token?}   no login needed; returns {token}
   POST {action:"message", code, token|bearer, body}
   POST {action:"nudge", code, member_id}                       (owner) email a straggler
   POST {action:"delete", code}                                 (owner)
   Friends never need an account: their first RSVP mints a token the page
   keeps in localStorage. Contacts are never returned to other members. */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { admin, userFromRequest } from "../lib/auth.mjs";
import { sendEmail, layout, P, esc, SITE } from "../lib/email.mjs";

const TRIPS = JSON.parse(readFileSync(new URL("../data/trips-snapshot.json", import.meta.url), "utf8"));
const trip = (id) => TRIPS.find((t) => t.id === id);
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const B32 = "abcdefghjkmnpqrstuvwxyz23456789";
const rnd = (n) => Array.from(randomBytes(n), (b) => B32[b % B32.length]).join("");
const clean = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
const fmtDates = (s) => {
  const f = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  return s.date_out ? (s.date_back ? `${f(s.date_out)} – ${f(s.date_back)}` : f(s.date_out)) : "dates TBC";
};

const publicMember = (m) => ({ id: m.id, name: m.name, status: m.status, user_id: m.user_id ? true : false, created_at: m.created_at });

async function load(db, code) {
  const { data: send } = await db.from("sends").select("*").eq("code", code).maybeSingle();
  if (!send) return null;
  const [{ data: members }, { data: messages }] = await Promise.all([
    db.from("send_members").select("*").eq("send_id", send.id).order("created_at"),
    db.from("send_messages").select("id,member_id,name,body,created_at").eq("send_id", send.id).order("created_at", { ascending: false }).limit(100),
  ]);
  return { send, members: members || [], messages: (messages || []).reverse() };
}

function view(bundle, me) {
  const { send, members, messages } = bundle;
  const t = trip(send.trip_id) || { id: send.trip_id, name: send.trip_id };
  const owner = members.find((m) => m.user_id === send.owner) || members[0];
  return {
    code: send.code, trip_id: send.trip_id, trip: { id: t.id, name: t.name, tag: t.tag, cost: t.cost, days: t.days },
    origin: send.origin, date_out: send.date_out, date_back: send.date_back, headcount: send.headcount, note: send.note,
    created_at: send.created_at, host: owner ? owner.name : "Someone",
    members: members.map(publicMember), messages,
    me: me ? { id: me.id, name: me.name, status: me.status, is_owner: !!me.user_id && me.user_id === send.owner } : null,
  };
}

async function ownerFor(req, db, bundle, body) {
  const user = await userFromRequest(req);
  if (user && user.id === bundle.send.owner) return bundle.members.find((m) => m.user_id === user.id) || { user_id: user.id, name: "Host" };
  if (body?.token) { const m = bundle.members.find((x) => x.token === body.token); if (m && m.user_id === bundle.send.owner) return m; }
  return null;
}

export default async (req) => {
  const db = admin();
  const url = new URL(req.url);

  if (req.method === "GET") {
    if (url.searchParams.get("mine")) {
      const user = await userFromRequest(req);
      if (!user) return json({ ok: false, error: "sign in" }, 401);
      const { data: owned } = await db.from("sends").select("id").eq("owner", user.id);
      const { data: on } = await db.from("send_members").select("send_id").eq("user_id", user.id);
      const ids = [...new Set([...(owned || []).map((s) => s.id), ...(on || []).map((m) => m.send_id)])];
      if (!ids.length) return json({ ok: true, sends: [] });
      const { data: sends } = await db.from("sends").select("code").in("id", ids);
      const out = [];
      for (const s of sends || []) { const b = await load(db, s.code); if (b) out.push(view(b, b.members.find((m) => m.user_id === user.id))); }
      out.sort((a, b) => String(a.date_out || "9").localeCompare(String(b.date_out || "9")));
      return json({ ok: true, sends: out });
    }
    const code = clean(url.searchParams.get("code"), 24).toLowerCase();
    if (!code) return json({ ok: false, error: "code required" }, 400);
    const b = await load(db, code);
    if (!b) return json({ ok: false, error: "not found" }, 404);
    const token = url.searchParams.get("token");
    let me = token ? b.members.find((m) => m.token === token) : null;
    if (!me) { const user = await userFromRequest(req); if (user) me = b.members.find((m) => m.user_id === user.id) || null; }
    return json({ ok: true, send: view(b, me), token: me ? me.token : undefined });
  }

  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  let body; try { body = await req.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
  const action = body.action;

  if (action === "create") {
    const user = await userFromRequest(req);
    if (!user) return json({ ok: false, error: "sign in to plan a send" }, 401);
    const t = trip(body.trip_id);
    if (!t) return json({ ok: false, error: "unknown trip" }, 400);
    const { data: prof } = await db.from("profiles").select("name").eq("id", user.id).maybeSingle();
    const name = clean(body.name || prof?.name || user.email?.split("@")[0], 40) || "Host";
    const code = `${t.id.replace(/[^a-z0-9]/g, "").slice(0, 5)}-${rnd(4)}`;
    const row = { code, owner: user.id, trip_id: t.id, origin: clean(body.origin, 40) || null,
      date_out: body.date_out || null, date_back: body.date_back || null,
      headcount: Math.min(12, Math.max(1, Number(body.headcount) || 2)), note: clean(body.note, 280) || null };
    const { data: send, error } = await db.from("sends").insert(row).select().single();
    if (error) return json({ ok: false, error: error.message }, 500);
    const token = rnd(20);
    await db.from("send_members").insert({ send_id: send.id, user_id: user.id, name, contact: user.email, token, status: "in" });
    return json({ ok: true, code, token, url: `${SITE}/s/${code}` });
  }

  const code = clean(body.code, 24).toLowerCase();
  const b = code ? await load(db, code) : null;
  if (!b) return json({ ok: false, error: "not found" }, 404);

  if (action === "rsvp") {
    const status = ["in", "out", "maybe"].includes(body.status) ? body.status : "in";
    const name = clean(body.name, 40); const contact = clean(body.contact, 120).toLowerCase() || null;
    let me = body.token ? b.members.find((m) => m.token === body.token) : null;
    if (!me) { const user = await userFromRequest(req); if (user) me = b.members.find((m) => m.user_id === user.id) || null; }
    if (!me && contact) me = b.members.find((m) => m.contact && m.contact.toLowerCase() === contact) || null;
    if (!me && !name) return json({ ok: false, error: "name required" }, 400);
    const wasIn = me?.status === "in";
    if (me) {
      const { data } = await db.from("send_members").update({ status, ...(name ? { name } : {}), ...(contact ? { contact } : {}) }).eq("id", me.id).select().single();
      me = data;
    } else {
      const user = await userFromRequest(req);
      const { data, error } = await db.from("send_members").insert({ send_id: b.send.id, user_id: user?.id || null, name, contact, token: rnd(20), status }).select().single();
      if (error) return json({ ok: false, error: error.message }, 500);
      me = data;
    }
    // tell the host the moment someone's in
    if (status === "in" && !wasIn && me.user_id !== b.send.owner) {
      const { data: ownerUser } = await db.auth.admin.getUserById(b.send.owner);
      const to = ownerUser?.user?.email; const t = trip(b.send.trip_id);
      if (to) sendEmail({ to, subject: `${me.name} is in for ${t?.name || b.send.trip_id}`,
        html: layout({ kicker: "Your send", headline: `${esc(me.name)} is <span style="color:#2547F0;border-bottom:5px solid #FFC838;">in.</span>`,
          bodyHtml: `<p style="${P}">${esc(me.name)} just tapped "I'm in" for ${esc(t?.name || b.send.trip_id)}, ${esc(fmtDates(b.send))}.</p>`,
          cta: "See who's in", ctaHref: `${SITE}/s/${b.send.code}`, footer: "You're getting this because you planned a send on sendofftrips.com." }),
        text: `${me.name} is in for ${t?.name || b.send.trip_id}. ${SITE}/s/${b.send.code}` }).catch(() => {});
    }
    return json({ ok: true, token: me.token, me: publicMember(me) });
  }

  if (action === "message") {
    let me = body.token ? b.members.find((m) => m.token === body.token) : null;
    if (!me) { const user = await userFromRequest(req); if (user) me = b.members.find((m) => m.user_id === user.id) || null; }
    if (!me) return json({ ok: false, error: "join the send first" }, 403);
    const text = clean(body.body, 1000); if (!text) return json({ ok: false, error: "empty" }, 400);
    const { data, error } = await db.from("send_messages").insert({ send_id: b.send.id, member_id: me.id, name: me.name, body: text }).select("id,member_id,name,body,created_at").single();
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, message: data });
  }

  const owner = await ownerFor(req, db, b, body);
  if (!owner) return json({ ok: false, error: "host only" }, 403);

  if (action === "nudge") {
    const m = b.members.find((x) => x.id === body.member_id);
    if (!m) return json({ ok: false, error: "no such member" }, 404);
    if (!m.contact || !m.contact.includes("@")) return json({ ok: false, error: "no email for them — text them the link" }, 400);
    const t = trip(b.send.trip_id);
    const ok = await sendEmail({ to: m.contact, subject: `${owner.name} is waiting on you: ${t?.name || b.send.trip_id}`,
      html: layout({ kicker: "Nudge", headline: `${esc(owner.name)} needs a <span style="color:#2547F0;border-bottom:5px solid #FFC838;">yes or no.</span>`,
        bodyHtml: `<p style="${P}">${esc(t?.name || b.send.trip_id)}, ${esc(fmtDates(b.send))}. ${b.members.filter((x) => x.status === "in").length} in so far. One tap and you're on the list.</p>`,
        cta: "I'm in", ctaHref: `${SITE}/s/${b.send.code}?t=${m.token}`, footer: "You're getting this because a friend invited you to a send on sendofftrips.com." }),
      text: `${owner.name} is waiting on you for ${t?.name || b.send.trip_id}: ${SITE}/s/${b.send.code}?t=${m.token}` });
    return json({ ok, nudged: m.name });
  }

  if (action === "delete") {
    await db.from("sends").delete().eq("id", b.send.id);
    return json({ ok: true });
  }

  return json({ ok: false, error: "unknown action" }, 400);
};

export const config = { path: "/api/send" };
