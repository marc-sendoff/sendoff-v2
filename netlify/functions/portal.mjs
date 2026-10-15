/* POST /api/portal   (signed in, has a Stripe customer)
   A Stripe billing portal link: change card, switch plan, cancel. */
import { userFromRequest, admin } from "../lib/auth.mjs";
import { stripe, SITE } from "../lib/stripe.mjs";
import { json } from "../lib/tp.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  const user = await userFromRequest(req);
  if (!user) return json({ ok: false, error: "sign in first" }, 401);
  const { data: mem } = await admin().from("memberships").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!mem?.stripe_customer_id) return json({ ok: false, error: "no billing on this account" }, 404);
  const session = await stripe().billingPortal.sessions.create({
    customer: mem.stripe_customer_id,
    return_url: `${SITE}/preview`,
  });
  return json({ ok: true, url: session.url });
};

export const config = { path: "/api/portal" };
