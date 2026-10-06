/* GA4 bootstrap + outbound-click tracking.
   Activates only when VITE_GA_ID is set at build time (.env.production, e.g. G-XXXXXXXXXX).
   The gate page has its own copy of this bootstrap in src/gate/main.jsx — that
   one is what visitors without a session actually load.
   Without it this module is a no-op, so local dev and previews stay clean. */
const GA_ID = import.meta.env.VITE_GA_ID;

/* Scroll depth: one event per milestone per page load. */
export function watchScrollDepth() {
  const hit = new Set();
  const onScroll = () => {
    const el = document.documentElement;
    const max = el.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const pct = (window.scrollY / max) * 100;
    for (const m of [25, 50, 75, 90]) {
      if (pct >= m && !hit.has(m)) {
        hit.add(m);
        if (window.gtag) window.gtag("event", "scroll_depth", { percent: m });
      }
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* Microsoft Clarity: click heatmaps, scroll maps, session recordings.
   Same contract as GA - inert unless VITE_CLARITY_ID is set at build time. */
export function bootClarity() {
  const id = import.meta.env.VITE_CLARITY_ID;
  if (!id) return;
  window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.clarity.ms/tag/" + id;
  document.head.appendChild(s);
}

watchScrollDepth();
bootClarity();

if (GA_ID) {
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);

  /* Partner hosts whose clicks are revenue signal (Travelpayouts short links
     redirect through tpk.lv; the marker is attached by the emrldtp script). */
  const PARTNER_HOSTS = ["tpk.lv"];

  document.addEventListener(
    "click",
    (e) => {
      const a = e.target && e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      let url;
      try { url = new URL(a.href, window.location.href); } catch { return; }
      if (url.host === window.location.host || url.protocol === "mailto:") return;
      const isPartner = PARTNER_HOSTS.some(
        (h) => url.host === h || url.host.endsWith("." + h)
      );
      window.gtag("event", isPartner ? "partner_click" : "outbound_click", {
        link_domain: url.host,
        link_url: url.href.slice(0, 120),
        link_text: (a.textContent || "").trim().slice(0, 80),
      });
    },
    true
  );
}
