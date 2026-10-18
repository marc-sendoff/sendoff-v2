import React, { useState, useMemo, Suspense, lazy } from "react";
import { LazyMotion, MotionConfig, m } from "motion/react";
const loadMotionFeatures = () => import("./motion-features.js").then((mod) => mod.default);
import { T, VIBES, SH, SPRING, applyTheme, DEFAULT_THEME } from "./theme.js";
import { CITIES, TRIPS, AIRPORTS } from "./data/trips.js";
import { priceAll } from "./data/pricing.js";
import { WORLD_CITIES } from "./data/cities.js";
import { getCheapest } from "./utils/cheapest.js";
import CheapestRail from "./components/browse/CheapestRail.jsx";
import { fmt, miles, modeLabel, sendRequest, setCurrency } from "./data/config.js";
import { useAccount } from "./lib/account.js";
import { User } from "lucide-react";

/* Display currency per origin: world origins carry theirs; the curated US
   list is USD. Rates come from /api/rates (USD base, refreshed nightly). */
const CURRENCY_BY_ORIGIN = new Map(WORLD_CITIES.map((w) => [w.name, w.currency]));
import { OriginSlot, CrewSlot, BudgetSlot, DateSlot, Logo } from "./components/core.jsx";
import { TripCardV3 as TripCard } from "./components/browse/TripCardV3.jsx";
import { VibeRail } from "./components/browse/VibeRail.jsx";
import { SearchSortBar } from "./components/browse/SearchSortBar.jsx";
import DealDrops from "./components/DealDrops.jsx";
import WelcomeSplash from "./components/WelcomeSplash.jsx";
import InstallNudge from "./components/InstallNudge.jsx";
import ReferralCard from "./components/ReferralCard.jsx";
import Waitlist from "./components/Waitlist.jsx";
import Footer from "./components/Footer.jsx";
import { hasLaunched, currentStage } from "./data/rollout.js";

/* Load the brand fonts from the app itself, so every build renders
   identically no matter what the surrounding page contains. */
/* Hard stop: the page can never scroll or stretch sideways on any device. */
(function lockHorizontal() {
  if (typeof document === "undefined") return;
  if (document.querySelector("style[data-sendoff-nohscroll]")) return;
  const st = document.createElement("style");
  st.setAttribute("data-sendoff-nohscroll", "1");
  st.textContent = "html,body{max-width:100%;overflow-x:hidden;} #root{max-width:100vw;overflow-x:clip;}";
  document.head.appendChild(st);
})();

(function loadBrandFonts() {
  if (typeof document === "undefined") return;
  if (document.querySelector("link[data-sendoff-fonts]")) return;
  const pre1 = document.createElement("link");
  pre1.rel = "preconnect"; pre1.href = "https://fonts.googleapis.com";
  const pre2 = document.createElement("link");
  pre2.rel = "preconnect"; pre2.href = "https://fonts.gstatic.com"; pre2.crossOrigin = "anonymous";
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Sans:wght@400;600;700&display=swap";
  link.setAttribute("data-sendoff-fonts", "1");
  document.head.appendChild(pre1);
  document.head.appendChild(pre2);
  document.head.appendChild(link);
})();

/* Heavy sections load as separate chunks the first time they are shown. */
const GlobeMap = lazy(() => import("./components/GlobeMap.jsx"));
const formsImport = () => import("./components/forms.jsx");
const CustomSendoff = lazy(() => formsImport().then((m) => ({ default: m.CustomSendoff })));
const BigSend = lazy(() => formsImport().then((m) => ({ default: m.BigSend })));
const Community = lazy(() => import("./components/community.jsx").then((m) => ({ default: m.Community })));
const About = lazy(() => import("./components/About.jsx"));
const SpinSend = lazy(() => import("./components/SpinSend.jsx"));
const modalsImport = () => import("./components/modals.jsx");
const PlusModal = lazy(() => modalsImport().then((m) => ({ default: m.PlusModal })));
const SignInModal = lazy(() => modalsImport().then((m) => ({ default: m.SignInModal })));
const Founders = lazy(() => import("./components/Founders.jsx"));
const Detail = lazy(() => modalsImport().then((m) => ({ default: m.Detail })));
const ProfileModal = lazy(() => modalsImport().then((m) => ({ default: m.ProfileModal })));

const lazyFallback = (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 20px",
    fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700, fontSize: 14, color: T.ink, opacity: 0.55 }}>
    Loading…
  </div>
);

/* ---------- main app ---------- */

export default function Sendoff() {
  const [origin, setOrigin] = useState("Miami");
  const [budget, setBudget] = useState(500);
  const [friends, setFriends] = useState(3);
  const [vibe, setVibe] = useState("all");
  const [query, setQuery] = useState("");
  /* "Best match" first: a $500 visitor should not open on the three most
     expensive trips in their budget. */
  const [sortBy, setSortBy] = useState("best");
  const [visible, setVisible] = useState(6);
  const [view, setView] = useState("trips");
  /* Nov 1 onwards the app IS the site (see main.jsx). It changes two things in
     here: where the signup list sits, and that a closed city has somewhere to
     go — picking one scrolls down to the list with the city filled in. */
  const launched = hasLaunched();
  const [waitCity, setWaitCity] = useState("");
  const askForCity = (city) => {
    setWaitCity(city);
    setOpenSlot(null);
    requestAnimationFrame(() => {
      document.getElementById("get-on-the-list")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };
  /* Currency: convert every fmt() at render into the origin's currency. Until
     rates arrive (or if they never do) everything stays USD, unconverted. */
  const [rates, setRates] = useState(null);
  React.useEffect(() => {
    let on = true;
    fetch("/api/rates").then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (on && j?.ok && j.rates) setRates(j.rates); })
      .catch(() => {});
    return () => { on = false; };
  }, []);
  const wantCurrency = CURRENCY_BY_ORIGIN.get(origin) || "USD";
  const rate = wantCurrency === "USD" ? 1 : Number(rates?.[wantCurrency]);
  const localCurrency = rate > 0 ? wantCurrency : "USD";
  setCurrency(localCurrency, rate > 0 ? rate : 1);
  /* No URL routing: surface tab changes to analytics as screen views. */
  React.useEffect(() => {
    if (window.gtag) window.gtag("event", "screen_view", { screen_name: view });
    if (window.clarity) window.clarity("set", "view", view);
  }, [view]);
  const [dateOut, setDateOut] = useState("");
  const [dateBack, setDateBack] = useState("");
  const [openSlot, setOpenSlot] = useState(null);
  const [detail, setDetailRaw] = useState(null);
  const setDetail = (t) => {
    if (t) setOpened((n) => { const next = n + 1; writeStore("sendoff_opened", next); return next; });
    setDetailRaw(t);
  };
  /* member state, remembered between visits where the browser allows it */
  const readStore = (k, fallback) => {
    try { const v = window.localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  };
  const writeStore = (k, v) => { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  /* who's signed in, their membership, their trips — all from the account
     layer (src/lib/account.js). Signed out = free tier, nothing saved. The
     old browser-only member flag is gone on purpose: Plus lives on accounts. */
  const acct = useAccount();
  const member = acct.isMember;
  const [showAccount, setShowAccount] = useState(false);
  const [opened, setOpened] = useState(() => readStore("sendoff_opened", 0));
  const doneTrips = useMemo(() => acct.done.map((t) => t.trip_id), [acct.done]);
  const markDone = (t) => {
    if (!acct.user) { setShowAccount(true); return; } // done-sends live on the account
    acct.setTrip(t.id, "done");
    sendRequest("Trip completed 🎉", {
      traveler: acct.profile?.name || "(anonymous)",
      email: acct.user.email || "(no email)",
      trip: t.name,
      trip_cost: fmt(t.cost) + "/person",
      from_city: origin,
      crew: friends + 1,
    });
  };
  const [showProfile, setShowProfile] = useState(false);
  const [showPlus, setShowPlus] = useState(false);
  /* Spin-Send booking bonus. The wheel hands over the trip it picked; when the
     detail sheet for THAT trip opens a booking search, the gate service (which
     chose the winner) banks the points. Resolves to the points awarded, 0 when
     already banked this cycle or when the server disagrees. */
  const [wheelPick, setWheelPick] = useState(null);
  const claimWheelBonus = async (t) => {
    try {
      const r = await fetch("/api/spins/book", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ tripId: t.id, name: acct.profile?.name || "" }),
      });
      const b = await r.json().catch(() => ({}));
      return r.ok && b.ok ? b.awarded : 0;
    } catch { return 0; }
  };
  /* Plus just got unlocked (code or checkout): close the pitch, show the card */
  const onUnlocked = () => { setShowPlus(false); setShowProfile(true); };
  /* Founders pick a look; it lives on their profile. Everyone else sees the
     original. Changing it re-renders the tree with the new tokens. */
  const [themeName, setThemeName] = useState(DEFAULT_THEME);
  const isFounder = acct.membership?.plan === "founder";
  React.useEffect(() => {
    const want = isFounder && acct.profile?.theme ? acct.profile.theme : DEFAULT_THEME;
    setThemeName(applyTheme(want));
  }, [isFounder, acct.profile?.theme]);
  const pickTheme = (name) => { setThemeName(applyTheme(name)); acct.saveProfile({ theme: name }); };

  const originCoords = CITIES[origin] || CITIES[Object.keys(CITIES).find((c) => c.toLowerCase() === origin.toLowerCase())] || null;
  const dates = { out: dateOut, back: dateBack };
  const today = new Date().toISOString().slice(0, 10);
  const setOut = (v) => { setDateOut(v); if (dateBack && v && v > dateBack) setDateBack(""); };
  /* trip length falls out of the dates — no separate "days" input needed */
  const tripDays = dateOut && dateBack
    ? Math.max(1, Math.round((new Date(dateBack) - new Date(dateOut)) / 86400000) + 1)
    : null;

  /* Cheapest-actual-sends ranking for this origin + crew. Null hides the
     rail AND the live sort option — never an empty or broken row. */
  const [cheapest, setCheapest] = useState(null);
  React.useEffect(() => {
    let alive = true;
    const iata = AIRPORTS[origin];
    if (!iata) { setCheapest(null); return; }
    setCheapest(null);
    getCheapest(iata, friends + 1)
      .then((d) => { if (alive) setCheapest(d); })
      .catch(() => { /* helper already falls back; belt and braces */ });
    return () => { alive = false; };
  }, [origin, friends]);
  /* If the live sort is selected and its data vanishes (origin switch),
     land on the static budget sort instead of a dead tab. */
  React.useEffect(() => {
    if (!cheapest && sortBy === "cheaplive") setSortBy("low");
  }, [cheapest, sortBy]);

  /* ONE PRICE PER TRIP. Every list below reads from `priced`, never TRIPS:
     live fare where the nightly pull has one for this origin, curated
     estimate where it doesn't, stay split by crew either way (pricing.js). */
  const liveRows = useMemo(
    () => new Map((cheapest?.results ?? []).map((r) => [r.tripId, r])),
    [cheapest]
  );
  const priced = useMemo(
    () => priceAll(TRIPS, { oc: originCoords, crew: friends + 1, live: liveRows }),
    [originCoords, friends, liveRows]
  );

  const { results, durationRelaxed } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const searching = q.length > 0;
    const base = priced.filter((t) => {
      const vibeOk = vibe === "all" || t.vibes.includes(vibe);
      if (!vibeOk) return false;
      if (searching) {
        /* When someone searches by name, always find it — don't hide it
           behind budget, dates, or distance filters. */
        const hay = (t.name + " " + t.tag + " " + t.stayName + " " + t.city + " " + t.blurb).toLowerCase();
        return hay.includes(q);
      }
      if (t.cost > budget * 1.15) return false;
      /* road-trip-only sends don't make sense from across the country */
      if (t.driveOnly && originCoords) {
        const driveH = miles(originCoords[0], originCoords[1], t.lat, t.lon) / 62;
        if (driveH > 18) return false;
      }
      return true;
    });
    /* Your dates set the window: nothing longer than you have, and nothing
       that wastes more than a day of it. If no trip can fill a long window,
       fall back to the longest sends we've got (flagged in the UI). */
    const fits = tripDays && !searching
      ? base.filter((t) => t.days <= tripDays && t.days >= tripDays - 1)
      : base;
    const relaxed = Boolean(tripDays) && !searching && fits.length === 0 && base.length > 0;
    const list = relaxed ? [...base].sort((a, b) => b.days - a.days) : fits;
    const dist = (t) => (originCoords ? miles(originCoords[0], originCoords[1], t.lat, t.lon) : 0);
    if (searching) return { results: list.sort((a, b) => a.cost - b.cost), durationRelaxed: false };
    if (relaxed) return { results: list, durationRelaxed: true };
    let sorted;
    if (sortBy === "high") sorted = list.sort((a, b) => b.cost - a.cost);
    else if (sortBy === "low") sorted = list.sort((a, b) => a.cost - b.cost);
    else if (sortBy === "close") sorted = list.sort((a, b) => dist(a) - dist(b));
    else if (sortBy === "cheaplive" && cheapest) {
      /* live all-in ranking first; trips the data lane hasn't priced yet
         follow in static-budget order — the grid is never empty */
      const rank = new Map(cheapest.results.map((r, i) => [r.tripId, i]));
      const key = (t) => (rank.has(t.id) ? rank.get(t.id) : 100000 + t.cost);
      sorted = list.sort((a, b) => key(a) - key(b));
    }
    /* "best" = cheap and reasonably close, with distance only lightly weighted */
    else sorted = list.sort((a, b) => (a.cost + dist(a) * 0.06) - (b.cost + dist(b) * 0.06));
    return { results: sorted, durationRelaxed: false };
  }, [priced, budget, tripDays, vibe, originCoords, query, sortBy, cheapest]);

  /* start from the top again whenever the search or filters change */
  React.useEffect(() => { setVisible(6); }, [query, sortBy, vibe, budget, tripDays, origin]);

  const overBudgetCount = useMemo(
    () => (query.trim() ? results.filter((t) => t.cost > budget * 1.15).length : 0),
    [results, budget, query]
  );

  /* ---------- the freemium lock ----------
     Free accounts see FREE_VISIBLE sends outright plus TEASE blurred ones, then
     the ask. A search is never gated: if someone types a trip name they get to
     see whether it exists, otherwise search feels broken rather than paywalled. */
  const FREE_VISIBLE = 5;
  const TEASE = 3;
  const gated = !member && !query.trim() && results.length > FREE_VISIBLE;
  const shown = gated ? results.slice(0, FREE_VISIBLE + TEASE) : results.slice(0, visible);
  const lockedCount = gated ? results.length - FREE_VISIBLE : 0;

  const stretchPick = useMemo(
    () => priced.filter((t) => t.cost > budget * 1.15 && (vibe === "all" || t.vibes.includes(vibe))).sort((a, b) => a.cost - b.cost)[0],
    [priced, budget, vibe]);

  return (
    <LazyMotion features={loadMotionFeatures} strict>
    <MotionConfig reducedMotion="user">
    <div onClick={() => openSlot && setOpenSlot(null)}
      key={themeName}
      style={{ minHeight: "100vh", background: T.paper, color: T.ink, fontFamily: "'Instrument Sans', sans-serif",
        paddingBottom: gated && view === "trips" ? 116 : 60 }}>
      <style>{`
        /* the reset lives in @layer base so it still beats UA defaults but
           yields to Tailwind utilities (index.css pins base < utilities) —
           unlayered it silently kills every margin-* class in v3 views */
        @layer base {
          * { box-sizing: border-box; margin: 0; }
        }
        ::-webkit-scrollbar { display: none; }
        button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid ${T.cobalt}; outline-offset: 2px; }
        /* Phones: tighten the tab pills so six of them wrap onto fewer rows —
           every extra row pushes content down on every view. Horizontal padding
           carries the saving; vertical padding is held so the tap target keeps
           its height. !important because these buttons carry inline styles. */
        @media (max-width: 640px) {
          .sendoff-tabs { gap: 6px !important; padding-left: 12px !important; padding-right: 12px !important;
            flex-wrap: nowrap !important; overflow-x: auto; -webkit-overflow-scrolling: touch;
            scroll-snap-type: x proximity; scroll-padding-left: 12px; }
          .sendoff-tab { font-size: 11.5px !important; padding: 10px 12px !important; letter-spacing: -0.2px; flex-shrink: 0; scroll-snap-align: start; }
        }
      `}</style>

      {/* one-per-session launch splash — overlays everything, never gates the app's render */}
      <WelcomeSplash />
      <InstallNudge />

      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "18px 20px", maxWidth: 960, margin: "0 auto" }}>
        <Logo />
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => (member ? setShowProfile(true) : setShowPlus(true))}
            style={{ fontSize: 14, fontWeight: 800, background: member ? T.ink : T.cobalt, color: member ? T.sun : T.white,
              border: `2px solid ${T.ink}`, borderRadius: 999, padding: "10px 18px", cursor: "pointer",
              boxShadow: `3px 3px 0 ${T.shadow}`, fontFamily: "'Bricolage Grotesque', sans-serif", whiteSpace: "nowrap" }}>
            {member ? "✦ SENDOFF+" : "GET SENDOFF+"}
          </button>
          {/* signed in: your initial, opens the profile card. Signed out: a plus, opens sign-in. */}
          <button onClick={() => (acct.user ? setShowProfile(true) : setShowAccount(true))}
            title={acct.user ? "Your profile" : "Sign in"}
            style={{ width: 42, height: 42, borderRadius: "50%", background: acct.user ? T.sun : T.white,
              border: `2px solid ${T.ink}`, boxShadow: `3px 3px 0 ${T.shadow}`, cursor: "pointer",
              fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16, color: T.ink,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {acct.user ? ((acct.profile?.name || acct.user.email || "✦").trim()[0] || "✦").toUpperCase() : <User size={20} strokeWidth={2.6} aria-label="Sign in" />}
          </button>
        </div>
      </header>

      {/* tabs */}
      <nav className="sendoff-tabs" style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {/* On phones this row scrolls sideways (see the @media rule above)
            instead of wrapping to three rows above every view. */}
        {/* The Founders Club tab is out for the December v1 — the club is
            frozen, and its seats were an approval flow on a server we no
            longer run. FoundersClub.jsx stays in the tree, unreferenced, so
            bringing it back is one entry in this list plus one line below. */}
        {[["trips", "THE TRIPS"], ["spin", "SPIN-SEND 🎡"], ["custom", "PERSONAL SENDOFF ✨"], ["big", "THE BIG SEND 🎉"], ["community", "COMMUNITY 📸"], ["founders", "FOUNDERS ✦"], ["about", "OUR STORY"]].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} className="sendoff-tab"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 13,
              padding: "9px 16px", borderRadius: 999,
              border: `2px solid ${T.ink}`,
              background: view === id ? T.ink : T.white,
              color: view === id ? T.paper : T.ink,
              cursor: "pointer", whiteSpace: "nowrap" }}>
            {label}
          </button>
        ))}
      </nav>

      <Suspense fallback={lazyFallback}>
        {view === "spin" && (
          <SpinSend trips={results} origin={origin} friends={friends} budget={budget}
            onPick={(t, meta) => { setWheelPick(meta?.bonus ? { id: t.id, bonus: meta.bonus } : null); setDetail(t); }} />
        )}
        {view === "custom" && <CustomSendoff origin={origin} />}
        {view === "big" && <BigSend origin={origin} />}
        {view === "community" && <Community origin={origin} />}
        {view === "about" && <About setView={setView} />}
        {view === "founders" && <Founders acct={acct} onJoin={() => setShowPlus(true)} />}
      </Suspense>

      {view === "trips" && (<>
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "26px 20px 8px" }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
          fontSize: "clamp(27px, 6vw, 44px)", lineHeight: 1.32, letterSpacing: "-0.5px", maxWidth: 760 }}>
          I'm in <OriginSlot origin={origin} setOrigin={setOrigin} open={openSlot} setOpen={setOpenSlot}
            onAskForCity={launched && currentStage() !== "world" ? askForCity : undefined} /> with{" "}
          <BudgetSlot budget={budget} setBudget={setBudget} open={openSlot} setOpen={setOpenSlot} /> and{" "}
          <CrewSlot friends={friends} setFriends={setFriends} open={openSlot} setOpen={setOpenSlot}
            goBigSend={() => { setView("big"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />.
          Where can we go?
        </div>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
          fontSize: "clamp(19px, 4vw, 26px)", marginTop: 16, letterSpacing: "-0.3px" }}>
          Leaving <DateSlot value={dateOut} min={today} placeholder="pick a date" onChange={setOut} /> → back{" "}
          <DateSlot value={dateBack} min={dateOut || today} placeholder="pick a date" onChange={setDateBack} />
          {tripDays && <span style={{ fontSize: "0.7em", opacity: 0.55, marginLeft: 10 }}>({tripDays} days)</span>}
        </div>
        <p style={{ marginTop: 14, fontSize: 15, fontWeight: 600, opacity: 0.7, maxWidth: 560 }}>
          Endless sends for the window between "just graduated" and "real life" — and for anyone with a travel ambition. Prices are per person, hacks included, new trips dropping constantly. Your city, dates + crew carry into every booking link.
        </p>
        {localCurrency !== "USD" && (
          <p style={{ marginTop: 6, fontSize: 13, fontWeight: 600, opacity: 0.55, maxWidth: 560 }}>
            Prices shown in {localCurrency}, converted from USD at today's rate. Booking sites charge in their own currency.
          </p>
        )}
      </section>

      {/* Pre-launch the list is the one thing we ask for, so it sits directly
          under the hero. Once Sendoff is open it moves below the trips: the
          trips are the product, and the list is only for the people whose city
          hasn't opened yet. */}
      {!launched && <Waitlist origin={origin} />}

      <DealDrops origin={origin} member={member} onOpenTrip={setDetail} onJoin={() => setShowPlus(true)} />

      {/* cheapest actual sends — hidden entirely until data exists for this origin */}
      <CheapestRail data={cheapest} origin={origin} crew={friends + 1} onOpenTrip={setDetail} />

      {/* vibe rail: one calm line that scrolls sideways on phones instead of stacking */}
      <div style={{ maxWidth: 960, margin: "18px auto 6px", padding: "0 20px", display: "flex", gap: 8,
        overflowX: "auto", WebkitOverflowScrolling: "touch", scrollSnapType: "x proximity", scrollPaddingLeft: 20 }}>
        <VibeRail vibes={VIBES} vibe={vibe} setVibe={setVibe} />
      </div>

      <section style={{ maxWidth: 960, margin: "0 auto", padding: "18px 20px" }}>
        {/* one sort control instead of four wrapping buttons — calmer, and it
            fits next to the search on a phone (v3: published SmoothTab pills) */}
        <SearchSortBar query={query} setQuery={setQuery} sortBy={sortBy} setSortBy={setSortBy} liveSort={Boolean(cheapest)} />
        <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.6, marginBottom: 16 }}>
          {query.trim()
            ? `${results.length} ${results.length === 1 ? "send" : "sends"} matching "${query}"` +
              (overBudgetCount ? ` · ${overBudgetCount} above your budget` : "")
            : gated
              ? `${FREE_VISIBLE} of ${results.length} sends within your budget shown — unlock the rest`
              : `${results.length} ${results.length === 1 ? "send" : "sends"} within your budget`}
        </div>
        {durationRelaxed && tripDays && (
          <div style={{ background: T.sun, border: `2px solid ${T.ink}`, borderRadius: 12,
            boxShadow: `3px 3px 0 ${T.shadow}`, padding: "11px 14px", fontSize: 13.5, fontWeight: 700, marginBottom: 16 }}>
            Your dates give you {tripDays} days — our longest sends run about a week, so here are the longest first.
            Want the full {tripDays}-day plan built for you?{" "}
            <button onClick={() => setView("custom")}
              style={{ background: "none", border: "none", padding: 0, color: T.cobalt, fontWeight: 800,
                fontSize: 13.5, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>
              Get a Personal Sendoff →
            </button>
          </div>
        )}
        {/* the grid animates: surviving cards glide to their new spots when
            filters change, new arrivals stagger in (see TripCard). Leavers are
            removed instantly — calmer, and immune to stuck-exit edge cases. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 20 }}>
          {shown.map((t, i) => (
            <TripCard key={t.id} trip={t} i={i} mode={modeLabel(t, originCoords)}
              over={t.cost > budget * 1.15} locked={gated && i >= FREE_VISIBLE}
              onOpen={gated && i >= FREE_VISIBLE ? () => setShowPlus(true) : setDetail} />
          ))}
        </div>
        {/* Free accounts get the ask at the end of the blur, with nothing dead
            after it. Members keep the plain "show 10 more" pager. */}
        {gated ? (
          <div style={{ margin: "26px auto 0", background: T.sun, color: T.onAccent, border: `2px solid ${T.ink}`,
            borderRadius: 18, boxShadow: `5px 5px 0 ${T.shadow}`, padding: "22px 20px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 23 }}>
              {lockedCount} more {lockedCount === 1 ? "send" : "sends"} in your budget 🔒
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 5 }}>
              Sendoff+ opens every trip, plus deal drops the day fares land.
            </div>
            <m.button onClick={() => setShowPlus(true)} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              transition={SPRING}
              style={{ marginTop: 14, background: T.cobalt, color: T.onCobalt, border: `2px solid ${T.ink}`,
                borderRadius: 14, boxShadow: `3px 3px 0 ${T.shadow}`, padding: "13px 22px",
                fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15.5, cursor: "pointer" }}>
              Unlock with Sendoff+ →
            </m.button>
          </div>
        ) : results.length > visible && (
          <m.button onClick={() => setVisible((n) => n + 10)} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            transition={SPRING}
            style={{ display: "block", margin: "26px auto 0", background: T.white, color: T.ink,
              border: `2px solid ${T.ink}`, borderRadius: 999, boxShadow: SH.card,
              padding: "13px 26px", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
              fontSize: 15.5, cursor: "pointer" }}>
            Show 10 more sends ↓ <span style={{ fontWeight: 600, opacity: 0.6 }}>({results.length - visible} left)</span>
          </m.button>
        )}
        {results.length === 0 && (
          <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}
            style={{ textAlign: "center", padding: "40px 0", fontWeight: 700, fontSize: 16 }}>
            Nothing fits that combo yet — bump the budget a notch 👆
          </m.div>
        )}
        {stretchPick && (
          <div style={{ marginTop: 34, background: T.ink, color: T.paper, border: `2px solid ${T.ink}`, borderRadius: 18,
            boxShadow: `5px 5px 0 ${T.cobalt}`, padding: "20px 22px", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.sun, letterSpacing: 1 }}>WORTH SAVING FOR</div>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, marginTop: 3 }}>
                {stretchPick.img} {stretchPick.name} — {fmt(stretchPick.cost)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.75, marginTop: 3 }}>
                {fmt(Math.ceil((stretchPick.cost - budget) / 12))} a month for a year and it's yours.
              </div>
            </div>
            <button onClick={() => setDetail(stretchPick)}
              style={{ background: T.sun, border: `2px solid ${T.paper}`, borderRadius: 12, padding: "10px 16px",
                fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 14, cursor: "pointer", color: T.ink }}>
              Peek at it →
            </button>
          </div>
        )}
      </section>

      <Suspense fallback={lazyFallback}>
        <GlobeMap trips={priced} origin={origin} originCoords={originCoords} budget={budget} vibe={vibe} done={doneTrips}
          onOpen={setDetail} />
      </Suspense>
      {/* services promo — deliberately small; the trips are the main event */}
      <section style={{ maxWidth: 960, margin: "26px auto 0", padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 14 }}>
          <m.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={SPRING} onClick={() => { setView("custom"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            style={{ textAlign: "left", background: T.sun, border: `2px solid ${T.ink}`, borderRadius: 16,
              boxShadow: `4px 4px 0 ${T.shadow}`, padding: "14px 16px", cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif", color: T.ink }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16 }}>
              ✨ Can't find your send?
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 3, opacity: 0.8 }}>
              We'll build your trip custom — $10. →
            </div>
          </m.button>
          <m.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={SPRING}
            onClick={() => { setView("big"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            style={{ textAlign: "left", background: T.white, border: `2px solid ${T.ink}`, borderRadius: 16,
              boxShadow: `4px 4px 0 ${T.shadow}`, padding: "14px 16px", cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif", color: T.ink }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16 }}>
              🎉 Rolling 8+ deep?
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 3, opacity: 0.8 }}>
              The Big Send — we run the whole group trip. $20/person. →
            </div>
          </m.button>
        </div>
      </section>

      {/* Launched: the ask sits here, under the trips, and only while there are
          still cities to open. From Dec 10 everything is open and the sign-in
          on the account takes over from the list. */}
      {launched && currentStage() !== "world" && (
        <Waitlist origin={origin} launched city={waitCity} />
      )}

      {/* your referral link — renders only when the gate service knows this browser */}
      <ReferralCard />
      </>)}

      <Footer />

      <Suspense fallback={null}>
      {detail && <Detail trip={detail} origin={origin} originCoords={originCoords} friends={friends + 1} dates={dates}
        member={member} isDone={doneTrips.includes(detail.id)} onMarkDone={markDone}
        wheelBonus={wheelPick && wheelPick.id === detail.id ? wheelPick.bonus : 0} onBook={claimWheelBonus}
        onJoin={() => { setDetail(null); setShowPlus(true); }} onClose={() => { setDetail(null); setWheelPick(null); }} />}
      {showPlus && <PlusModal origin={origin} acct={acct} onUnlocked={onUnlocked} onClose={() => setShowPlus(false)} />}
      {showAccount && <SignInModal acct={acct} origin={origin} onClose={() => setShowAccount(false)} />}
      {showProfile && acct.user && (
        <ProfileModal acct={acct} opened={opened} origin={origin} themeName={themeName} onTheme={pickTheme}
          onClose={() => setShowProfile(false)}
          onGetPlus={() => { setShowProfile(false); setShowPlus(true); }} />
      )}
      </Suspense>

      {/* Sticky ask: keeps the upgrade one tap away so scroll depth stops
          deciding whether anyone ever sees it. Free accounts on the trips tab
          only, and it steps aside while a modal is open. */}
      {gated && view === "trips" && !detail && !showPlus && !showProfile && !showAccount && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
          background: T.ink, color: T.paper, borderTop: `2px solid ${T.sun}`,
          padding: "11px 16px calc(11px + env(safe-area-inset-bottom))",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.35 }}>
            {lockedCount} more {lockedCount === 1 ? "send" : "sends"} locked 🔒
            <span style={{ display: "block", fontWeight: 600, fontSize: 11.5, opacity: 0.7 }}>
              Everything in your budget with Sendoff+
            </span>
          </span>
          <button onClick={() => setShowPlus(true)}
            style={{ border: `2px solid ${T.ink}`, borderRadius: 999, background: T.sun, color: T.onAccent,
              fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 13.5,
              padding: "10px 16px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            Unlock →
          </button>
        </div>
      )}
    </div>
    </MotionConfig>
    </LazyMotion>
  );
}
