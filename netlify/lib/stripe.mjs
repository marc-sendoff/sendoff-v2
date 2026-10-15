import Stripe from "stripe";

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set in the Netlify environment");
  return new Stripe(key, { apiVersion: "2025-09-30.clover" });
}

export const SITE = (process.env.SITE_URL || "https://sendofftrips.com").replace(/\/+$/, "");

/* Prices are created in the Stripe dashboard; their ids come from the env so
   test mode and live mode can point at different products. */
export const PRICES = {
  month: process.env.STRIPE_PRICE_MONTHLY || "",
  year: process.env.STRIPE_PRICE_YEARLY || "",
};
export const STUDENT_COUPON = process.env.STRIPE_COUPON_STUDENT || ""; // 5% off, see docs/MEMBERSHIP.md
export const isStudentEmail = (e) => /\.edu(\.[a-z]{2,})?$|\.ac\.[a-z]{2,}$/i.test(String(e || "").trim());

/* What a Stripe subscription means for our membership row. */
export function membershipFromSubscription(sub) {
  const active = ["active", "trialing", "past_due"].includes(sub.status);
  const item = sub.items?.data?.[0];
  const periodEnd = item?.current_period_end ?? sub.current_period_end;
  return {
    plan: active ? "plus" : "free",
    source: "stripe",
    interval: item?.price?.recurring?.interval ?? null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
    stripe_subscription_id: sub.id,
  };
}
