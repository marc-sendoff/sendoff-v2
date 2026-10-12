# Membership model — draft of record

Captured from Marc, 2026-10-11. **Not built, not scheduled.** December v1 is the
signup page only; nothing here ships until there is a way to take money.

---

## The three tiers

### Free
- 10 trips a year
- 30% of the catalogue restricted *(see open question 3 — this conflicts with
  "freemium only sees 20% of trips")*
- Upsell line on the locked trips: "only $4.99 to view more trips in your budget"

### Sendoff+ — $4.99/mo or $44.99/yr
For the impulsive. The pitch is speed: we forward deals the day they land.
- Unlimited trips
- Live fares and deal drops, pushed same-day (e.g. "AA $29.99 NYC→Dallas this week")
- Live price calendar — real prices, peak dates
- Discounted eSIMs for international trips
- **Student discount**: 20% off monthly or yearly with a student email
- **Referrals**: 1 friend = 1 month free, 2 friends = 2 months, and so on.
  8 friends = 1 gift box. 16 friends = 2 gift boxes.

### Founders Club — $100, one-time, first year
Everything in Sendoff+, plus:
- **Eligibility**: offered to the first 500 signups; only 100 seats exist.
  Email signups only, and only people who did **not** use a referral code.
- **Gift boxes**: 4 a year, one every 3 months — Sendoff-themed, seasonal
  (hats, pens, notebooks, pins). **First year only: 6 boxes.**
- **Box budget cap: $65 per member per year.**
- **One event a year** with the Sendoff team — club night, dinner, banquet,
  yacht day.
- **Renews yearly.**
- **Lifetime access**: refer 3 people → earn the *option to buy* lifetime
  access, which also includes a concierge helpline.

---

## Open questions — answer before any of this gets built

### 1. Founders Club loses money as written
At $100 for year one:

| | |
|---|---|
| Revenue per member | $100 |
| 6 boxes, contents at the $65 cap | −$65 |
| Shipping, 6 parcels at ~$9 | −$54 |
| **Before the event** | **−$19** |
| Annual event, 100 people | −$?? (a yacht day is thousands) |

The $65 cap covers *contents* but nothing has been set aside for postage, and
year one ships six times instead of four. Every seat costs more than it earns
before anyone has been invited anywhere.

Ways out, pick one: raise the price, drop year one to 4 boxes, make the event
cheap (club night, not yacht day), or accept it as a marketing spend with a
hard budget — 100 seats × $X, written down in advance.

### 2. Lifetime access is an unbounded liability
One payment, then boxes and concierge support forever. Two fixes: define
lifetime as *Sendoff+ features only* (no physical goods), or cap it ("lifetime"
= 5 years). Leaving it open-ended is the kind of promise that gets expensive
exactly when the business starts working.

### 3. Three different free-tier limits
The spec says all of these: free users see **20%** of trips; **30%** of trips
are restricted; free is capped at **10 trips a year**. Pick one rule and say it
in one sentence — it has to fit on a locked card.

### 4. The event can't name the old team
The draft says the yearly event is "with the sendoff founders team (me, Oz,
Issa, etc)". They're out, and their names were removed from the site at their
request. The perk is an event with **you**.

### 5. None of this can take payment yet
There is no checkout. Stripe was never wired — the payment links in the old
code are empty strings. Memberships need Stripe, which needs a business entity
and a bank account on file. That is weeks of setup, not a weekend.

### 6. Referrals and seats need accounts
Counting referrals, tracking who has a seat, gating 70% of trips — all of it
needs logins, which v1 deliberately doesn't have. The membership tiers and the
account system are the same project; neither ships without the other.

### 7. Physical goods make this an operations business
Four to six shipments a year means addresses, a fulfilment partner, sales tax
on goods, customs if anyone moves abroad, and someone to handle a box that
arrives broken. The software is the easy half.

---

## Suggested order

1. **December**: signup page only. Build the list. *(done)*
2. **Measure**: how many signups, which cities, how many open the emails.
3. **Then Sendoff+ alone** — it's digital, so no shipping, no fulfilment, and
   Stripe plus logins is the whole build.
4. **Founders Club last.** It's the one with real-world costs, and it reads
   better as a reward to a list that already exists than as a launch feature.
