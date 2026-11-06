/* One transactional email through Resend, in the site's look. Needs
   RESEND_API_KEY in the Netlify environment (same key the signup handler
   uses). Returns true when Resend accepted it. */
const FROM = "Sendoff <support@sendofftrips.com>";
const SITE = (process.env.SITE_URL || "https://sendofftrips.com").replace(/\/+$/, "");

export async function sendEmail({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error("email: RESEND_API_KEY is not set"); return false; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
  });
  if (!res.ok) console.error(`email: resend ${res.status} ${await res.text().catch(() => "")}`);
  return res.ok;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const P = `margin:0 0 16px;font-family:'Instrument Sans',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;font-weight:500;color:#1B1D2A;`;

/* The wrapper every Sendoff email shares: paper background, white card with
   the ink border, the logo on top, the sign-off at the bottom. */
export function layout({ kicker, headline, bodyHtml, cta, ctaHref, footer }) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(headline)}</title></head>
<body style="margin:0;padding:0;background:#F4F1E8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1E8;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 0 14px;"><img src="${SITE}/brand/logo-ink.png" width="150" alt="Sendoff" style="display:block;width:150px;height:auto;"></td></tr>
<tr><td style="padding:0 0 12px;font-family:'Instrument Sans',Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#2547F0;">${esc(kicker)}</td></tr>
<tr><td style="background:#FFFFFF;border:2px solid #1B1D2A;border-radius:20px;padding:28px 26px 30px;">
<p style="margin:0 0 20px;font-family:'Bricolage Grotesque',Arial Black,Arial,Helvetica,sans-serif;font-size:30px;line-height:1.15;font-weight:800;letter-spacing:-0.6px;color:#1B1D2A;">${headline}</p>
${bodyHtml}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="background:#2547F0;border:2px solid #1B1D2A;border-radius:12px;">
<a href="${ctaHref}" style="display:inline-block;padding:12px 20px;font-family:'Instrument Sans',Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">${esc(cta)} &rarr;</a></td></tr></table>
<p style="margin:0;font-family:'Bricolage Grotesque',Arial Black,Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;color:#1B1D2A;">Go while you're young. &#9992;&#65039;</p>
<p style="margin:16px 0 0;font-family:'Instrument Sans',Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;font-weight:500;color:#1B1D2A;">&mdash; Marc<br><span style="opacity:0.7;">Sendoff &middot; <a href="${SITE}" style="color:#2547F0;text-decoration:none;">sendofftrips.com</a></span></p>
</td></tr>
<tr><td style="padding:18px 8px 0;font-family:'Instrument Sans',Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#1B1D2A;opacity:0.6;">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}
export { P, esc, SITE };
