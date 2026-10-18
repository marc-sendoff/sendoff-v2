/* POST /api/stripe-webhook — Stripe tells us what happened to a subscription
   and we mirror it onto the membership row. The signature check means only
   Stripe can call this. The user is found through the metadata we attached
   at checkout, falling back to the customer's metadata. */
import { admin, setMembership, claimFounderSeat } from "../lib/auth.mjs";
import { stripe, membershipFromSubscription } from "../lib/stripe.mjs";
import { json } from "../lib/tp.mjs";

/* A yearly subscription that is live takes a Founders seat if any are left;
   a Founder keeps the badge for life, whatever happens to the subscription. */
async function withFounder(uid, fields, { fresh = false } = {}) {
  /* Only a fresh purchase (checkout completed) can claim a seat. Every later
     subscription event (renewal, update, cancel) keeps whatever the row has,
     so a seat that was removed by hand stays removed instead of coming back
     the next time Stripe pings. */
  if (fresh && fields.plan === "plus" && fields.interval === "year") {
    const seat = await claimFounderSeat(uid);
    if (seat) return { ...fields, plan: "founder", founder_number: seat };
  }
  const { data: cur } = await admin().from("memberships").select("founder_number").eq("user_id", uid).maybeSingle();
  if (cur?.founder_number) return { ...fields, plan: fields.plan === "free" ? "free" : "founder", founder_number: cur.founder_number };
  return fields;
}

async function userIdFor(s, sub) {
  if (sub.metadata?.user_id) return sub.metadata.user_id;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return null;
  const { data } = await admin().from("memberships").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
  if (data?.user_id) return data.user_id;
  const c = await s.customers.retrieve(customerId);
  return c?.metadata?.user_id ?? null;
}

export default async (req) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return json({ ok: false, error: "STRIPE_WEBHOOK_SECRET not set" }, 503);
  const s = stripe();
  let event;
  try {
    event = s.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") || "", secret);
  } catch (err) {
    return json({ ok: false, error: `bad signature: ${err.message}` }, 400);
  }
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription) {
        const sub = await s.subscriptions.retrieve(session.subscription);
        const uid = session.metadata?.user_id || (await userIdFor(s, sub));
        if (uid) await setMembership(uid, await withFounder(uid, membershipFromSubscription(sub), { fresh: true }));
      }
    } else if (event.type.startsWith("customer.subscription.")) {
      const sub = event.data.object;
      const uid = await userIdFor(s, sub);
      if (uid) await setMembership(uid, await withFounder(uid, membershipFromSubscription(sub)));
    }
  } catch (err) {
    console.error(`webhook ${event.type}: ${err.message}`);
    return json({ ok: false, error: "handler failed" }, 500);
  }
  return json({ ok: true, received: event.type });
};

export const config = { path: "/api/stripe-webhook" };
