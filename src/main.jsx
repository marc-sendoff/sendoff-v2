import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import Landing from "./Landing.jsx";
import "./index.css";
import "./analytics.js";

/* Installable: the service worker caches the shell + seen photos so the
   home-screen version opens instantly. Only on the real site, never in dev. */
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

/* Until December the site is the signup page and nothing else.

   /preview is the one exception: it renders the full app so Marc can see the
   trips, prices and booking flow on the live domain without putting them in
   front of visitors. The app is lazy-loaded so the landing page's bundle
   doesn't carry all 281 trips. The route is unlisted and told not to index;
   switching the whole site over in December is still just rendering
   <Sendoff /> here instead of <Landing />. */
const Sendoff = lazy(() => import("./App.jsx"));
const PREVIEW = window.location.pathname.replace(/\/+$/, "") === "/preview";

if (PREVIEW) {
  const m = document.createElement("meta");
  m.name = "robots"; m.content = "noindex, nofollow";
  document.head.appendChild(m);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  PREVIEW
    ? <Suspense fallback={null}><Sendoff /></Suspense>
    : <Landing />
);
