/* Runs on every verified Netlify Forms submission. The waitlist box on the
   site lands here, and from here the person goes into Resend as a contact,
   so the list Marc emails from is the list people actually signed up to.

   Netlify Forms stays the record of what was submitted; Resend is where the
   emails go out. Before this, a new signup sat in Netlify until someone
   copied it across by hand.

   Needs RESEND_API_KEY in the Netlify environment — a key with full access,
   not the sending-only one Supabase uses. Without it, the function logs and
   does nothing, and the submission is still saved in Netlify.

   Event functions export an object with one method per event (Netlify's
   typed handler syntax), not the `export default (req) =>` form the /api/*
   functions use. `formSubmitted` fires once the submission passed the spam
   check; event.data is the fields keyed by name. */

const RESEND = "https://api.resend.com/contacts";

const field = (data, k) => String(data?.[k] ?? "").trim();

async function addContact(key, body) {
  const res = await fetch(RESEND, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, text: await res.text() };
}

export default {
  async formSubmitted(event) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.error("submission-created: RESEND_API_KEY is not set; signup stays in Netlify only");
      return;
    }

    const data = event?.data || {};
    const email = field(data, "email").toLowerCase();
    if (!email) return;                       // not the waitlist form, or a broken row
    const name = field(data, "name");
    const city = field(data, "city");

    /* First try with the city as a custom property (so the US / world emails
       can go out by city later). If the property hasn't been created in
       Resend → Audience → Properties, Resend rejects it; then add the contact
       without it rather than lose the signup. A duplicate email is also a
       4xx and the retry is harmless. */
    const base = { email, first_name: name.split(/\s+/)[0] || undefined, unsubscribed: false };
    let r = await addContact(key, city ? { ...base, properties: { city } } : base);
    if (!r.ok && city && r.status < 500) {
      console.warn(`submission-created: Resend refused the city property (${r.status}: ${r.text}); retrying without it`);
      r = await addContact(key, base);
    }

    if (r.ok) console.log(`submission-created: ${email} (${city || "no city"}) added to Resend`);
    else console.error(`submission-created: Resend ${r.status} for ${email}: ${r.text}`);
    /* Nothing is thrown on purpose: a Resend hiccup must never make the
       submission look failed; the person is already saved in Netlify Forms. */
  },
};
