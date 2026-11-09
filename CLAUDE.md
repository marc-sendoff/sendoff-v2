# Sendoff — CLAUDE.md

## What this is

Sendoff (sendofftrips.com) is a trip-discovery site for young travelers: pick your
origin city, budget, crew size, and vibe — get destinations you can actually afford.
Tagline: "Go while you're young."

- **One founder: Marc.** The original four-person team split in October 2026. The
  site was shut down for three days and relaunched solo.
- **Launch: Florida November 1 2026, rest of the US November 15, everywhere
  else December 10.** (Moved up from Dec 20 / Jan 10 / Feb 15 on Oct 15.)
- Marketing channel: Instagram (mobile traffic dominates).
- Revenue: Travelpayouts affiliate links.

## The most important thing to know

**The app is the site — since launch day, November 1 2026.** `src/main.jsx`
renders the app once `hasLaunched()` (src/data/rollout.js) says launch day has
passed, and the signup page (`src/Landing.jsx`) before that. The origin picker is
gated by stage (Florida → US Nov 15 → world Dec 10) in `src/data/rollout.js`;
all destinations are always visible. Built by `npm run build` into `dist/`,
deployed by Netlify on every push to `main`.

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
- `data/trips.js` — `TRIPS` (**294 trips**), re-exports `CITIES`, `AIRPORTS`
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
6. **Accounts, payments and Founders Club are live** (since Oct 2026): sign-in
   by email link (Supabase), Sendoff+ at $4.99/mo or $40/yr through Stripe
   (live keys in Netlify, webhook at /api/stripe-webhook), the first ten yearly
   buyers become Founders. Free visitors get three fixed trips; a free account adds the two
   best in every category; the rest are blurred. Spin-Send is Plus-only. Don't reintroduce the old "v1 is frozen"
   framing from before the relaunch.

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
- **Travelpayouts**: marker `763771` (`AFF.travelpayouts`; `561612` was a never-used
  placeholder) + partner short-links in `PARTNER`, both in `src/data/config.js`.
  Live fares: `netlify/functions/pull-fares.mjs` runs every 30 minutes, one origin city per
  run (each of the 12 refreshes every 6 hours), into Netlify Blobs; `/api/cheapest` and `/api/fare` read them.
- **Accounts**: Supabase project `sendoff` (tables `profiles`, `memberships`,
  `user_trips`, schema in `supabase/schema.sql`). **Payments**: Stripe live;
  prices/coupon/webhook ids live in Netlify env. **Email**: Resend; new signups
  land there via `netlify/functions/submission-created.mjs`.
- **Instagram**: `@sendoff.trips`. **Contact**: `support@sendofftrips.com`.
- **Domain**: sendofftrips.com at Porkbun, pointed at Netlify.

- **Fare alerts (Plus)**: "Watch this send" on the trip sheet writes a row in
  `public.watches` (own table, so a send can be done AND watched). The scheduled
  `netlify/functions/fare-alerts.mjs` (:10 and :40, after each pull) emails via Resend
  when a watched fare drops 10%+ and keeps `typical/<ORIGIN>` in Blobs, which
  `/api/deals` (`deals.mjs`) uses for real Deal Drops (20%+ under typical after
  6 refreshes). Migrations: `supabase/migrations/2026-11-07-watches.sql` (supersedes 2026-11-06-watching).
- Destination photos for the 13 park/camping trips added Nov 6 2026 come from
  Wikimedia Commons (public domain / CC BY / CC BY-SA); each is credited on
  `public/credits.html` (/credits, linked from the footer). Any new stock photo
  from Commons must be added there too.

## Known issues / open decisions

- Trip photography is still destination stock, not real sends (the community
  wall has Marc's own).
- Live fares cover 12 origin cities; everywhere else shows the curated estimate
  with an "est." tag. Widen the pull before the US stage opens on Nov 15.
