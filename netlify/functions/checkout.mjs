/* POST /api/checkout  { plan: "month" | "year" }   (signed in)
   Opens a Stripe Checkout page for Sendoff+. The customer is tied to the
   Supabase user id so the webhook can find the account afterwards. Student
   emails (.edu) get the 5% coupon applied automatically. */
import { userFromRequest, admin } from "../lib/auth.mjs";
import { stripe, SITE, PRICES, STUDENT_COUPON, isStudentEmail } from "../lib/stripe.mjs";
import { json } from "../lib/tp.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  const user = await userFromRequest(req);
  if (!user) return json({ ok: false, error: "sign in first" }, 401);
  let plan = "month";
  try { plan = String((await req.json())?.plan ?? "month"); } catch { /* default */ }
  const price = PRICES[plan];
  if (!price) return json({ ok: false, error: "plan not available yet" }, 503);

  const s = stripe();
  const { data: mem } = await admin().from("memberships").select("stripe_customer_id, plan").eq("user_id", user.id).maybeSingle();
  let customer = mem?.stripe_customer_id || null;
  if (!customer) {
    const c = await s.customers.create({ email: user.email, metadata: { user_id: user.id } });
    customer = c.id;
    await admin().from("memberships").upsert({ user_id: user.id, stripe_customer_id: customer, updated_at: new Date().toISOString() });
  }
  const student = STUDENT_COUPON && isStudentEmail(user.email);
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price, quantity: 1 }],
    ...(student ? { discounts: [{ coupon: STUDENT_COUPON }] } : { allow_promotion_codes: true }),
    subscription_data: { metadata: { user_id: user.id } },
    metadata: { user_id: user.id },
    success_url: `${SITE}/preview?checkout=success`,
    cancel_url: `${SITE}/preview?checkout=cancel`,
  });
  return json({ ok: true, url: session.url, student: Boolean(student) });
};

export const config = { path: "/api/checkout" };
