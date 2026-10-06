import React, { useState } from "react";
import { T } from "../theme.js";
import { fmt, sendRequest, CUSTOM_CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "../data/config.js";

/* ---------- YOUR PERSONAL SENDOFF (custom trip service) ---------- */
export function CustomSendoff({ origin }) {
  const [f, setF] = useState({ name: "", contact: "", from: origin, dates: "", budget: "", people: "4", dream: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const inputStyle = {
    width: "100%", fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: 16,
    padding: "12px 14px", border: `2px solid ${T.ink}`, borderRadius: 12, background: T.white, color: T.ink,
  };
  const labelStyle = { fontSize: 13, fontWeight: 800, display: "block", margin: "16px 0 6px", letterSpacing: 0.3 };
  const inquiry = () => [
    `🛫 PERSONAL SENDOFF REQUEST`,
    `Name: ${f.name}`,
    `Contact: ${f.contact}`,
    `Leaving from: ${f.from}`,
    `Dates: ${f.dates || "flexible"}`,
    `Budget: ${f.budget}/person · Crew: ${f.people}`,
    `The dream: ${f.dream}`,
  ].join("\n");
  const submit = async () => {
    setSending(true);
    const ok = await sendRequest("Personal Sendoff Request ($10)", {
      name: f.name, contact: f.contact, leaving_from: f.from, dates: f.dates || "flexible",
      budget_per_person: f.budget, crew_size: f.people, the_dream: f.dream,
    });
    if (!ok) {
      setFailed(true);
      try { await navigator.clipboard.writeText(inquiry()); } catch (e) {}
    }
    setSending(false);
    setSent(true);
  };
  const ready = f.name && f.contact && f.budget && f.dream;
  return (
    <section style={{ maxWidth: 640, margin: "0 auto", padding: "26px 20px 40px" }}>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
        fontSize: "clamp(27px, 6vw, 40px)", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
        Wanna make your own Sendoff, <span style={{ color: T.cobalt, borderBottom: `5px solid ${T.sun}` }}>your way</span>?
      </div>
      <p style={{ marginTop: 12, fontSize: 15.5, fontWeight: 600, opacity: 0.75, lineHeight: 1.5 }}>
        Tell us the dream — we build the whole trip, custom. Flights found, stay picked, day-by-day plan,
        budget split for the crew, affordable hacks included. Delivered to your DMs within 48 hours.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "16px 0 4px" }}>
        {["✈️ Cheapest flights found", "🏠 Stay picked + linked", "🗓️ Day-by-day plan", "💸 Budget split per person"].map((x) => (
          <span key={x} style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: 999,
            padding: "6px 12px", fontSize: 12.5, fontWeight: 700 }}>{x}</span>
        ))}
      </div>

      {!sent ? (
        <div style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: 20,
          boxShadow: `5px 5px 0 ${T.ink}`, padding: "20px 22px 24px", marginTop: 20 }}>
          <label style={labelStyle}>YOUR NAME</label>
          <input style={inputStyle} value={f.name} onChange={set("name")} placeholder="Alex" />
          <label style={labelStyle}>BEST WAY TO REACH YOU (IG / TEXT / EMAIL)</label>
          <input style={inputStyle} value={f.contact} onChange={set("contact")} placeholder="@yourhandle or 305-..." />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>LEAVING FROM</label>
              <input style={inputStyle} value={f.from} onChange={set("from")} />
            </div>
            <div>
              <label style={labelStyle}>DATES (OR "FLEXIBLE")</label>
              <input style={inputStyle} value={f.dates} onChange={set("dates")} placeholder="Mar 13–17" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>BUDGET / PERSON</label>
              <input style={inputStyle} value={f.budget} onChange={set("budget")} placeholder="$500" />
            </div>
            <div>
              <label style={labelStyle}>HOW MANY OF YOU</label>
              <input style={inputStyle} value={f.people} onChange={set("people")} />
            </div>
          </div>
          <label style={labelStyle}>THE DREAM — where do you wanna go? what's the vibe?</label>
          <textarea style={{ ...inputStyle, minHeight: 96, resize: "vertical" }} value={f.dream} onChange={set("dream")}
            placeholder="Somewhere warm, big beach energy, one crazy night out, nothing over $600 each..." />

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <button onClick={submit} disabled={!ready || sending}
              style={{ flex: 1, minWidth: 220, background: (ready && !sending) ? T.cobalt : "#B9C0D9", color: T.white,
                border: `2px solid ${T.ink}`, borderRadius: 14, boxShadow: (ready && !sending) ? `4px 4px 0 ${T.ink}` : "none",
                padding: "14px", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16,
                cursor: (ready && !sending) ? "pointer" : "not-allowed" }}>
              {sending ? "Sending…" : "Request my Sendoff →"}
            </button>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 20 }}>
              $10 <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.6 }}>service fee</span>
            </div>
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.55, marginTop: 10 }}>
            No payment now — we confirm your trip is doable first, then you pay and we build. Custom made by the Sendoff team.
          </div>
        </div>
      ) : (
        <div style={{ background: failed ? "#FFF4E5" : "#E8F5EC", border: `2px solid ${T.ink}`, borderRadius: 20,
          boxShadow: `5px 5px 0 ${T.ink}`, padding: "24px 22px", marginTop: 20 }}>
          <div style={{ fontSize: 30 }}>{failed ? "📋" : "🛫"}</div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, marginTop: 6 }}>
            {failed ? "Almost — one more step" : "Request sent!"}
          </div>
          <p style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.5, marginTop: 8 }}>
            {failed ? (
              <>Couldn't send automatically, but your request is copied to your clipboard. Paste it to{" "}
                <a href={`mailto:${CUSTOM_CONTACT_EMAIL}?subject=Personal%20Sendoff%20Request&body=${encodeURIComponent(inquiry())}`}
                  style={{ color: T.cobalt, fontWeight: 800 }}>{CUSTOM_CONTACT_EMAIL}</a>{" "}
                or DM <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: T.cobalt, fontWeight: 800 }}>@{INSTAGRAM_HANDLE}</a> on Instagram.
                <span style={{ display: "block", fontSize: 11, opacity: 0.6, marginTop: 8 }}>
                  ({window.__SENDOFF_LAST_ERROR})
                </span></>
            ) : (
              <>We've got it. We'll reply within 24 hours to confirm your trip is doable, then get building.
                Delivered within 48 hours of that. 🛫</>
            )}
          </p>
          <button onClick={() => { setSent(false); setFailed(false); }}
            style={{ marginTop: 12, background: T.white, border: `2px solid ${T.ink}`, borderRadius: 10,
              padding: "8px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif" }}>
            ← Send another
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------- THE BIG SEND (group trips, 8+) ---------- */
export function BigSend({ origin }) {
  const [f, setF] = useState({ name: "", contact: "", from: origin, dates: "", budget: "", people: "12", dream: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const headcount = Math.max(0, parseInt(f.people, 10) || 0);
  const inputStyle = {
    width: "100%", fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: 16,
    padding: "12px 14px", border: `2px solid ${T.ink}`, borderRadius: 12, background: T.white, color: T.ink,
  };
  const labelStyle = { fontSize: 13, fontWeight: 800, display: "block", margin: "16px 0 6px", letterSpacing: 0.3 };
  const inquiry = () => [
    `🎉 THE BIG SEND REQUEST`,
    `Name: ${f.name}`,
    `Contact: ${f.contact}`,
    `Leaving from: ${f.from}`,
    `Dates: ${f.dates || "flexible"}`,
    `Budget: ${f.budget}/person · Group size: ${f.people}`,
    `The dream: ${f.dream}`,
  ].join("\n");
  const submit = async () => {
    setSending(true);
    const ok = await sendRequest("THE BIG SEND Request ($20/person)", {
      name: f.name, contact: f.contact, leaving_from: f.from, dates: f.dates || "flexible",
      budget_per_person: f.budget, group_size: f.people,
      planning_fee_total: "$" + (headcount * 20), the_dream: f.dream,
    });
    if (!ok) {
      setFailed(true);
      try { await navigator.clipboard.writeText(inquiry()); } catch (e) {}
    }
    setSending(false);
    setSent(true);
  };
  const ready = f.name && f.contact && f.budget && f.dream;
  return (
    <section style={{ maxWidth: 640, margin: "0 auto", padding: "26px 20px 40px" }}>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
        fontSize: "clamp(27px, 6vw, 40px)", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
        Got a <span style={{ color: T.cobalt, borderBottom: `5px solid ${T.sun}` }}>big group</span>? We'll run the whole thing.
      </div>
      <p style={{ marginTop: 12, fontSize: 15.5, fontWeight: 600, opacity: 0.75, lineHeight: 1.5 }}>
        Formals, spring break, grad trips, team trips — 8 people or 40. We find the place, lock the group rate,
        build the plan, and split the costs so nobody has to be the one chasing everyone for money.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "16px 0 4px" }}>
        {["🏨 Group rates negotiated", "🗓️ Full itinerary", "💸 Cost split per person", "📋 One organizer: us"].map((x) => (
          <span key={x} style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: 999,
            padding: "6px 12px", fontSize: 12.5, fontWeight: 700 }}>{x}</span>
        ))}
      </div>

      {!sent ? (
        <div style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: 20,
          boxShadow: `5px 5px 0 ${T.ink}`, padding: "20px 22px 24px", marginTop: 20 }}>
          <label style={labelStyle}>YOUR NAME</label>
          <input style={inputStyle} value={f.name} onChange={set("name")} placeholder="Alex" />
          <label style={labelStyle}>BEST WAY TO REACH YOU (IG / TEXT / EMAIL)</label>
          <input style={inputStyle} value={f.contact} onChange={set("contact")} placeholder="@yourhandle or 305-..." />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>LEAVING FROM</label>
              <input style={inputStyle} value={f.from} onChange={set("from")} />
            </div>
            <div>
              <label style={labelStyle}>DATES (OR "FLEXIBLE")</label>
              <input style={inputStyle} value={f.dates} onChange={set("dates")} placeholder="Mar 13–17" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>BUDGET / PERSON</label>
              <input style={inputStyle} value={f.budget} onChange={set("budget")} placeholder="$500" />
            </div>
            <div>
              <label style={labelStyle}>HOW MANY PEOPLE</label>
              <input style={inputStyle} type="number" min="8" value={f.people} onChange={set("people")} />
            </div>
          </div>
          <label style={labelStyle}>THE DREAM — where to, and what's the occasion?</label>
          <textarea style={{ ...inputStyle, minHeight: 96, resize: "vertical" }} value={f.dream} onChange={set("dream")}
            placeholder="Fraternity formal, somewhere warm, big nights out, everyone under $600..." />

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <button onClick={submit} disabled={!ready || sending}
              style={{ flex: 1, minWidth: 220, background: (ready && !sending) ? T.cobalt : "#B9C0D9", color: T.white,
                border: `2px solid ${T.ink}`, borderRadius: 14, boxShadow: (ready && !sending) ? `4px 4px 0 ${T.ink}` : "none",
                padding: "14px", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16,
                cursor: (ready && !sending) ? "pointer" : "not-allowed" }}>
              {sending ? "Sending…" : "Request The Big Send →"}
            </button>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 20 }}>
              $20 <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.6 }}>per person</span>
            </div>
          </div>
          {headcount >= 8 && (
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 10, color: T.cobalt }}>
              {headcount} people → {fmt(headcount * 20)} total planning fee (split: $20 each)
            </div>
          )}
          <div style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.55, marginTop: 10 }}>
            8 person minimum. No payment now — we confirm the trip works first, then you pay and we build it.
          </div>
        </div>
      ) : (
        <div style={{ background: failed ? "#FFF4E5" : "#E8F5EC", border: `2px solid ${T.ink}`, borderRadius: 20,
          boxShadow: `5px 5px 0 ${T.ink}`, padding: "24px 22px", marginTop: 20 }}>
          <div style={{ fontSize: 30 }}>{failed ? "📋" : "🎉"}</div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, marginTop: 6 }}>
            {failed ? "Almost — one more step" : "Request sent!"}
          </div>
          <p style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.5, marginTop: 8 }}>
            {failed ? (
              <>Couldn't send automatically, but your request is copied to your clipboard. Paste it to{" "}
                <a href={`mailto:${CUSTOM_CONTACT_EMAIL}?subject=The%20Big%20Send%20Request&body=${encodeURIComponent(inquiry())}`}
                  style={{ color: T.cobalt, fontWeight: 800 }}>{CUSTOM_CONTACT_EMAIL}</a>{" "}
                or DM <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: T.cobalt, fontWeight: 800 }}>@{INSTAGRAM_HANDLE}</a> on Instagram.
                <span style={{ display: "block", fontSize: 11, opacity: 0.6, marginTop: 8 }}>
                  ({window.__SENDOFF_LAST_ERROR})
                </span></>
            ) : (
              <>We've got it. We'll reply within 24 hours to talk through the group, lock in rates,
                and get your trip built. 🎉</>
            )}
          </p>
          <button onClick={() => { setSent(false); setFailed(false); }}
            style={{ marginTop: 12, background: T.white, border: `2px solid ${T.ink}`, borderRadius: 10,
              padding: "8px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif" }}>
            ← Send another
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------- SENDOFF CREW (matched group trips for solo travelers) ---------- */
export function SendoffCrew({ origin }) {
  const [f, setF] = useState({ name: "", contact: "", from: origin, dream: "", dates: "", budget: "", about: "", vibe: "any" });
  const [adult, setAdult] = useState(false);
  const [okRules, setOkRules] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const inputStyle = {
    width: "100%", fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: 16,
    padding: "12px 14px", border: `2px solid ${T.ink}`, borderRadius: 12, background: T.white, color: T.ink,
  };
  const labelStyle = { fontSize: 13, fontWeight: 800, display: "block", margin: "16px 0 6px", letterSpacing: 0.3 };
  const ready = f.name && f.contact && f.dream && f.about && adult && okRules;
  const submit = async () => {
    setSending(true);
    const ok = await sendRequest("SENDOFF CREW application 🤝", {
      name: f.name, contact: f.contact, leaving_from: f.from, dream_destination: f.dream,
      dates: f.dates || "flexible", budget_per_person: f.budget, vibe: f.vibe, about_them: f.about,
      confirmed_18_plus: "YES", agreed_to_rules: "YES",
    });
    if (!ok) { setFailed(true); }
    setSending(false); setSent(true);
  };
  const check = (val, setVal, text) => (
    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 12, cursor: "pointer" }}>
      <input type="checkbox" checked={val} onChange={(e) => setVal(e.target.checked)}
        style={{ width: 20, height: 20, marginTop: 1, accentColor: T.cobalt, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>{text}</span>
    </label>
  );

  return (
    <section style={{ maxWidth: 640, margin: "0 auto", padding: "26px 20px 40px" }}>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
        fontSize: "clamp(27px, 6vw, 40px)", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
        Nobody to go with? <span style={{ color: T.cobalt, borderBottom: `5px solid ${T.sun}` }}>Go with a crew.</span>
      </div>
      <p style={{ marginTop: 12, fontSize: 15.5, fontWeight: 600, opacity: 0.75, lineHeight: 1.5 }}>
        Tell us where you want to go and we'll build a crew around it — other travelers your age
        chasing the same trip. Minimum four people, never a one-on-one match.
      </p>

      <div style={{ background: T.ink, color: T.paper, border: `2px solid ${T.ink}`, borderRadius: 18,
        boxShadow: `5px 5px 0 ${T.ink}`, padding: "18px 20px", marginTop: 18 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16, color: T.sun }}>
          HOW WE KEEP IT SAFE
        </div>
        {[
          ["👥", "Crews of 4 minimum", "Never a pair. Group trips only."],
          ["🪪", "ID verified, 18+", "Everyone verifies before a crew is confirmed."],
          ["🛏️", "You book your own bed", "Your booking, your room, your name on it."],
          ["📞", "We talk to you first", "A quick video call before you're matched."],
        ].map(([e, t2, s2]) => (
          <div key={t2} style={{ display: "flex", gap: 11, marginTop: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 17 }}>{e}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13.5 }}>{t2}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.7 }}>{s2}</div>
            </div>
          </div>
        ))}
      </div>

      {!sent ? (
        <div style={{ background: T.white, border: `2px solid ${T.ink}`, borderRadius: 20,
          boxShadow: `5px 5px 0 ${T.ink}`, padding: "20px 22px 24px", marginTop: 20 }}>
          <label style={labelStyle}>YOUR NAME</label>
          <input style={inputStyle} value={f.name} onChange={set("name")} placeholder="Alex" />
          <label style={labelStyle}>INSTAGRAM OR EMAIL (how we reach you)</label>
          <input style={inputStyle} value={f.contact} onChange={set("contact")} placeholder="@yourhandle" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>LEAVING FROM</label>
              <input style={inputStyle} value={f.from} onChange={set("from")} />
            </div>
            <div>
              <label style={labelStyle}>BUDGET / PERSON</label>
              <input style={inputStyle} value={f.budget} onChange={set("budget")} placeholder="$600" />
            </div>
          </div>
          <label style={labelStyle}>WHERE DO YOU WANT TO GO?</label>
          <input style={inputStyle} value={f.dream} onChange={set("dream")} placeholder="Anywhere warm, or Japan specifically..." />
          <label style={labelStyle}>WHEN (OR "FLEXIBLE")</label>
          <input style={inputStyle} value={f.dates} onChange={set("dates")} placeholder="Spring break, or Mar 13–17" />
          <label style={labelStyle}>YOUR VIBE</label>
          <select style={inputStyle} value={f.vibe} onChange={set("vibe")}>
            {["any", "nature + hiking", "party + nightlife", "culture + museums", "beach + chill", "food", "adventure sports"]
              .map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <label style={labelStyle}>TELL US ABOUT YOU</label>
          <textarea style={{ ...inputStyle, minHeight: 96, resize: "vertical" }} value={f.about} onChange={set("about")}
            placeholder="Age, what you're into, what kind of trip you're after, early riser or 3am person..." />

          {check(adult, setAdult, "I'm 18 or older and I'll verify my ID before joining a crew.")}
          {check(okRules, setOkRules, "I understand crews are groups of 4+, I book and pay for my own travel, and Sendoff introduces travelers but doesn't supervise the trip.")}

          <button onClick={submit} disabled={!ready || sending}
            style={{ width: "100%", marginTop: 18, background: (ready && !sending) ? T.cobalt : "#B9C0D9", color: T.white,
              border: `2px solid ${T.ink}`, borderRadius: 14, boxShadow: (ready && !sending) ? `4px 4px 0 ${T.ink}` : "none",
              padding: "14px", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16,
              cursor: (ready && !sending) ? "pointer" : "not-allowed" }}>
            {sending ? "Sending…" : "Apply for a crew →"}
          </button>
          <div style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.55, marginTop: 10, textAlign: "center" }}>
            Free to apply. We'll only build a crew once enough people match your trip.
          </div>
        </div>
      ) : (
        <div style={{ background: failed ? "#FFF4E5" : "#E8F5EC", border: `2px solid ${T.ink}`, borderRadius: 20,
          boxShadow: `5px 5px 0 ${T.ink}`, padding: "24px 22px", marginTop: 20 }}>
          <div style={{ fontSize: 30 }}>{failed ? "📋" : "🤝"}</div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, marginTop: 6 }}>
            {failed ? "Almost — one more step" : "Application in!"}
          </div>
          <p style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.5, marginTop: 8 }}>
            {failed
              ? <>Couldn't send automatically. Email us at{" "}
                  <a href={`mailto:${CUSTOM_CONTACT_EMAIL}`} style={{ color: T.cobalt, fontWeight: 800 }}>{CUSTOM_CONTACT_EMAIL}</a>{" "}
                  or DM <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: T.cobalt, fontWeight: 800 }}>@{INSTAGRAM_HANDLE}</a> on Instagram.</>
              : <>We'll reach out for a quick chat and ID check. Once four+ travelers match your trip,
                  we'll introduce the crew and build the itinerary together. 🤝</>}
          </p>
          <button onClick={() => { setSent(false); setFailed(false); }}
            style={{ marginTop: 12, background: T.white, border: `2px solid ${T.ink}`, borderRadius: 10,
              padding: "8px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif" }}>
            ← Edit my application
          </button>
        </div>
      )}
    </section>
  );
}
