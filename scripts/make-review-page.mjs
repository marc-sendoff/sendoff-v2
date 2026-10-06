/* Generates dist/review.html — the per-PR cover page founders get as their
   share link. Reads PR_NUM, PR_TITLE, PR_BODY, PR_SHA from env (set by the
   Demo Preview workflow). Run after `vite build`. */
import { readFileSync, writeFileSync, existsSync } from "fs";

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const num = process.env.PR_NUM || "?";
const title = esc(process.env.PR_TITLE || "Untitled change");
const sha = (process.env.PR_SHA || "").slice(0, 7);
/* PR bodies are markdown we write ourselves — render minimally: escape, then
   bold + line breaks. Anything fancier belongs in the demo, not the cover. */
const body = esc(process.env.PR_BODY || "")
  .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
  .replace(/^### (.+)$/gm, "<b>$1</b>")
  .replace(/^## (.+)$/gm, "<b>$1</b>")
  .replace(/\r?\n/g, "<br>");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Sendoff · Review PR #${num}</title>
<style>
  body{margin:0;background:#F4F1E8;color:#1B1D2A;font-family:system-ui,sans-serif}
  main{max-width:560px;margin:0 auto;padding:36px 20px 60px}
  .chip{display:inline-block;background:#1B1D2A;color:#FFC838;font-weight:800;font-size:12px;
    letter-spacing:.08em;border-radius:999px;padding:6px 12px}
  h1{font-size:26px;letter-spacing:-.5px;line-height:1.2;margin:14px 0 4px}
  .meta{font-size:12.5px;opacity:.6;font-weight:600}
  .card{background:#fff;border:2px solid #1B1D2A;border-radius:16px;box-shadow:4px 4px 0 #1B1D2A;
    padding:16px 18px;margin-top:18px;font-size:14px;line-height:1.6;overflow-wrap:break-word}
  a.go{display:block;text-align:center;background:#2547F0;color:#fff;font-weight:800;font-size:18px;
    text-decoration:none;border:2px solid #1B1D2A;border-radius:14px;box-shadow:4px 4px 0 #1B1D2A;
    padding:16px;margin-top:22px}
  .how{font-size:13px;opacity:.75;line-height:1.6;margin-top:18px}
</style>
</head>
<body><main>
  <span class="chip">SENDOFF DEMO · PR #${num}${sha ? " · " + sha : ""}</span>
  <h1>${title}</h1>
  <div class="meta">This is a demo build for founder review — not the live site.</div>
  <div class="card">${body || "No description provided."}</div>
  <a class="go" href="./">Open the demo →</a>
  <p class="how"><b>How to review:</b> open the demo on your phone, try the things described above,
  then reply in the founders chat with a 👍 or what's broken. Nothing goes live from this page —
  approval just clears it to ship.</p>
</main></body>
</html>
`;

if (!existsSync("dist")) { console.error("run vite build first"); process.exit(1); }
writeFileSync("dist/review.html", html);
console.log(`wrote dist/review.html for PR #${num}`);
