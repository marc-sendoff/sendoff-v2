import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { launchDayPassed } from "./src/data/rollout.js";

/* The title and description in index.html depend on whether Sendoff has opened:
   before launch day it's "get on the list", after it's the product. The page
   itself flips on the date on its own (src/main.jsx), but these tags are static
   HTML read by Instagram, iMessage and Google, so they're filled in at build
   time. A build on or after LAUNCH ships the launched copy — meaning one push
   on launch day refreshes link previews. */
const COPY = {
  before: {
    SENDOFF_TITLE: "Sendoff — Launching November 1",
    SENDOFF_DESC:
      "Tell us your city, budget, and crew. We'll show you where you can actually afford to go. Launching November 1, starting with Florida — get on the list.",
  },
  after: {
    SENDOFF_TITLE: "Sendoff — Trips you can actually afford",
    SENDOFF_DESC:
      "Tell us your city, budget, and crew. We'll show you where you can actually afford to go. Real prices, real plans, the links to book it.",
  },
};

function launchMeta() {
  const copy = launchDayPassed() ? COPY.after : COPY.before;
  return {
    name: "sendoff-launch-meta",
    transformIndexHtml(html) {
      return html.replace(/%SENDOFF_(TITLE|DESC)%/g, (whole, key) => copy[`SENDOFF_${key}`] ?? whole);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), launchMeta()],
  resolve: {
    // shadcn/Kokonut copy-in components import via "@/..."
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
