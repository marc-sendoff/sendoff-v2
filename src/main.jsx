import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import Landing from "./Landing.jsx";
import { hasLaunched, launchDayPassed } from "./data/rollout.js";
import "./index.css";
import "./analytics.js";

/* Installable: the service worker caches the shell + seen photos so the
   home-screen version opens instantly. Only on the real site, never in dev. */
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

/* ============ WHAT THE SITE IS ============
   Before November 1: the signup page. From November 1: the app.

   The switch is the date, not a deploy — hasLaunched() (data/rollout.js) reads
   the first rollout stage, so at midnight on the 1st every visitor gets the
   app whether or not anything was pushed that day.

   Two ways to see the other side of it:
     /preview    the app, any time, unlisted and told not to index (as before)
     ?launch=1   the launched SITE early — same thing a visitor gets on Nov 1
     ?launch=0   the signup page again, after Nov 1

   The app is lazy-loaded so the signup page's bundle never carries the 281
   trips with it. */
const Sendoff = lazy(() => import("./App.jsx"));
const PREVIEW = window.location.pathname.replace(/\/+$/, "") === "/preview";
const LAUNCHED = hasLaunched();
/* A sign-in link lands with Supabase's tokens (or error) in the URL hash.
   Whatever page it arrives on, only the app can finish that, so show it. */
const AUTH_RETURN = /(access_token|refresh_token|error_code)=/.test(window.location.hash);
const SHOW_APP = PREVIEW || LAUNCHED || AUTH_RETURN;

/* Keep /preview, and any early look at the launched site, out of search
   results. Once launch day has actually passed, the site indexes normally. */
if (PREVIEW || (SHOW_APP && !launchDayPassed())) {
  const m = document.createElement("meta");
  m.name = "robots"; m.content = "noindex, nofollow";
  document.head.appendChild(m);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  SHOW_APP
    ? <Suspense fallback={null}><Sendoff /></Suspense>
    : <Landing />
);
