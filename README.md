# Sendoff

Trip-discovery site at [sendofftrips.com](https://sendofftrips.com). Pick your
city, budget, and crew — get destinations you can actually afford.

**Relaunching December 2026, Miami first.** One founder. Monetized via
Travelpayouts affiliate links.

## Stack

- Vite 7 + React 18 single-page app
- View state lives in React; there are no client-side routes in the URL
- Node 22 (pinned for the Netlify build in `netlify.toml`)

## Commands

```
npm install      # install dependencies
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # serve the built dist/ locally
```

## Deploy

Netlify, building from this repo. Every push to `main` redeploys.

| | |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 22 (`netlify.toml`) |

The old Hetzner box (178.156.221.89) is wiped and gone. Never deploy there and
never point DNS at it.

## The waitlist

The site's one conversion. `src/components/Waitlist.jsx` renders the visible
form; the hidden `<form name="waitlist">` in `index.html` is what Netlify's
build crawler registers. **Both must carry the same field names** — `name`,
`email`, `city`, plus `bot-field` as the honeypot.

Submissions arrive in Netlify → Forms → `waitlist`. Successful posts land on
`/thanks` (`public/thanks.html`, rewritten by `netlify.toml`).

## Known dead ends

Several components still call `/api/...` endpoints that lived on the old
server. They all fail silently with working fallbacks, so the console shows
404s by design. The Sendoff+ paywall still hides trips behind a membership that
can no longer be unlocked — see the open decisions in `CLAUDE.md`.

## Integrations

- **Netlify Forms** — the waitlist
- **Formspree** — the Personal Sendoff, Big Send and Community forms
  (`FORM_ENDPOINT` in `src/data/config.js`; account ownership unconfirmed)
- **Travelpayouts** — affiliate marker + partner short-links in
  `src/data/config.js`
- **Porkbun** — domain registrar for sendofftrips.com
