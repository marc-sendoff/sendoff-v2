# Sendoff — CLAUDE.md

## What this is

Sendoff (sendofftrips.com) is a trip-discovery site for young travelers: pick your
origin city, budget, crew size, and vibe — get destinations you can actually afford.
Tagline: "Go while you're young."

- **One founder: Marc.** The original four-person team split in October 2026. The
  site was shut down for three days and relaunched solo.
- **Relaunch: December 2026, Miami first.** Everything on the site says
  "Launching December".
- Marketing channel: Instagram (mobile traffic dominates).
- Revenue: Travelpayouts affiliate links.

## The most important thing to know

**The app is the site.** There is no gate any more. `sendofftrips.com` serves the
React app in `src/` directly, built by `npm run build` into `dist/` and deployed by
Netlify. Anything you wire into the app is what visitors see.

This is a change from the pre-October setup, where an email gate stood in front of
everything. If you find notes, issues, or old commits that say "the gate is what
visitors land on", they describe a system that no longer exists.

**The waitlist is the one conversion on the site.** `src/components/Waitlist.jsx`
posts to Netlify Forms. Its field names must stay in step with the hidden
registration form in `index.html` — Netlify's build crawler reads only that static
copy, never the React tree. Submissions land in Netlify → Forms → `waitlist`.

## Stack & layout

- **Vite 7 + React 18.** No TypeScript, no router (view state lives in React state).
- **Styling is mixed**: most components use inline styles with tokens from
  `src/theme.js`; newer `ui/` and `browse/` components use Tailwind
  (`tailwindcss` + `@tailwindcss/vite`, `src/index.css`). The reset in `App.jsx`
  lives in `@layer base` so it doesn't clobber Tailwind utilities.
- No tests for the web app.
- Heavy sections are code-split via `React.lazy` + `<Suspense>` in `src/App.jsx`.

### Repo layout

| Path | What |
|---|---|
| `src/` | the app — this is the site |
| `index.html` | the entry, the meta/OG tags, and the hidden Netlify form |
| `public/` | icons, `og-image.jpg`, `thanks.html`, 280 destination photos |
| `netlify.toml` | build command, publish dir, `/thanks` rewrite, headers |
| `admin/`, `studio/`, `bridge/` | old supporting services — **not deployed**, see below |
| `docs/` | specs and handover notes, much of it pre-split and stale |
| `scripts/` | build helpers |

### Module map (`src/`)

- `App.jsx` — main `Sendoff` component, tab/view state, brand fonts, lazy wiring
- `theme.js` — tokens `T`, `PALETTE`, `VIBES`, budget/crew constants, plus the
  shared surface recipe (`R`, `SH`, `surface`, `SPRING`)
- `data/trips.js` — `TRIPS` (**281 trips**), re-exports `CITIES`, `AIRPORTS`
- `data/cities.js` — `CITIES`, `AIRPORTS`, `WORLD_CITIES`
- `data/config.js` — monetization + integrations and helpers (`fmt`, `miles`,
  `bookLinks`, `sendRequest`, `setCurrency`)
- `data/mapdata.js` — globe/flat-map geometry. Imported ONLY by the map components
- `components/Waitlist.jsx` — the December waitlist (Netlify Forms)
- `components/core.jsx` — Chip, Origin/Crew/Budget/Date slots, Logo, BudgetBar
- `components/browse/` — `TripCardV3`, `VibeRail`, `SearchSortBar`, `CheapestRail`
- Lazy: `GlobeMap`, `TravelMap`, `modals.jsx`, `forms.jsx`, `community.jsx`,
  `About.jsx`, `SpinSend.jsx`
- `FoundersClub.jsx` — **unreferenced.** The club is frozen for v1; the file is
  kept so it can be rewired later (one nav entry + one line in `App.jsx`)

### Commands

`npm run dev` · `npm run build` · `npm run preview`

## Hosting & deploy

**Netlify, under Marc's account, building from this repo.** Every push to `main`
redeploys. Build `npm run build`, publish `dist`, Node 22 (pinned in
`netlify.toml`).

The old Hetzner box (178.156.221.89) is **wiped and gone — never deploy there and
never add it back to DNS.** Everything that talked to it has been removed from this
repo: the gate service, the Caddy/docker config, and the CI workflows that pushed
to it.

### Dead `/api/*` calls

Several components still `fetch("/api/...")` — rates, deals, live fares, cheapest,
leaderboard, spins, referrals. Those endpoints lived on the old box and now 404.
**Every one of them fails silently and the UI falls back**, which is why the site
works; the 404s in the console are expected. Don't "fix" them by rebuilding a
backend unless that is the actual task.

`admin/`, `studio/` and `bridge/` are leftovers from that era. They are not built,
not deployed, and not reachable. Delete them when it's convenient.

## Brand

Palette (the `T` constant in `src/theme.js`):

| Token  | Hex       | Use                    |
|--------|-----------|------------------------|
| paper  | `#F4F1E8` | background             |
| ink    | `#1B1D2A` | text, borders          |
| cobalt | `#2547F0` | primary / links        |
| sun    | `#FFC838` | accent                 |
| poppy  | `#FF5A3C` | accent / alerts        |

Fonts: **Bricolage Grotesque** for display, **Instrument Sans** for body.

Voice: young, direct, a bit irreverent ("Go while you're young", "Gators for gas
money"). Emoji are part of the current visual language.

## Hard rules

1. **No former team members anywhere.** Their names and photos were removed at
   their request. Never reintroduce a name, face, or "four founders" framing —
   `src/components/About.jsx` says "three friends" deliberately. The repo history
   starts at the relaunch so the old photos are not recoverable from it.
2. **Never remove the Travelpayouts marker or partner links in
   `src/data/config.js` without approval.** That is the revenue tracking.
3. **No secrets in the repo.** Only public build-time ids (`VITE_GA_ID`,
   `VITE_CLARITY_ID`) belong in the committed `.env.production`.
4. **Test mobile first (375px width).** Traffic comes from Instagram.
5. **Keep `npm run build` green.** Netlify deploys what it builds.
6. **v1 scope is frozen**: no logins, no payments, no Founders Club, no cities
   beyond Miami. December v1 = this site + ~15 Miami sends with real prices and
   affiliate book links.

## Integrations (pointers, not secrets)

- **Waitlist**: Netlify Forms, form name `waitlist`, fields `name` / `email` /
  `city`, honeypot `bot-field`, success page `/thanks`.
- **Analytics**: GA4 `G-00R0V7TRZV` and Clarity `y7j3r1bt7b`, injected at build
  time from `.env.production`. Clarity now points at Marc's own project; the id it
  replaced reported into a former teammate's account. **GA4 ownership is
  unconfirmed** — check that Marc's Google account admins that property, and make
  a new one if not.
- **Formspree**: `FORM_ENDPOINT` in `src/data/config.js` — used by the Personal
  Sendoff, Big Send and Community forms. **Unconfirmed whether Marc owns this
  account.** If he doesn't, those submissions are going to someone else; move them
  to Netlify Forms the same way the waitlist works.
- **Travelpayouts**: marker `561612` (`AFF.travelpayouts`) + partner short-links in
  `PARTNER`, both in `src/data/config.js`.
- **Instagram**: `@sendoff.trips`. **Contact**: `support@sendofftrips.com`.
- **Domain**: sendofftrips.com at Porkbun, pointed at Netlify.

## Known issues / open decisions

- **Sendoff+ paywall is a dead end.** The app still hides ~123 trips behind a
  membership, and the unlock path checked a server endpoint that no longer exists,
  so nobody can ever unlock it. Either drop the gating for v1 or wire a real
  payment — it can't stay as-is past launch.
- `CheapestRail` shows a hardcoded "prices from Aug 30" snapshot date.
- Membership state is localStorage-only.
- Trip photography is still destination stock, not real sends.
