# Membership model — draft of record

From Marc, 2026-10-11, revised the same day. **Not built, not scheduled.**
December v1 is the signup page only; nothing here ships until there is a way to
take money.

---

## The three tiers

### Free
- **3 trips.** One limit, not three — this replaces the earlier mix of
  "20% of trips / 30% restricted / 10 a year".
- Locked trips carry the upsell: "only $4.99 to see every trip in your budget"

### Sendoff+ — $4.99/mo or $44.99/yr
For the impulsive. The pitch is speed: we forward deals the day they land.
- Unlimited trips
- Live fares and deal drops, pushed same-day (e.g. "AA $29.99 NYC→Dallas this week")
- Live price calendar — real prices, peak dates
- Discounted eSIMs for international trips
- **Student discount**: 20% off monthly or yearly with a student email
- **Referrals**: 1 friend = 1 month free, 2 friends = 2 months, and so on.
  8 friends = 1 gift box. 16 friends = 2 gift boxes.

### Founders Club — $65/year, first 10 signups only
Everything in Sendoff+, plus:
- **2 boxes a year**, Sendoff-themed and seasonal (hats, pens, notebooks, pins)
- Optionally a small **birthday** send — see the budget below
- **Lifetime is earned, not sold**: a Founders member who brings **3 signups**
  unlocks the right to buy lifetime for **$150 once**, never pay again
- Renews yearly otherwise

---

## The budget, at $65 a year

Assuming ~$9 postage and ~$2 packaging per parcel:

| Boxes/yr | Shipping | Left for contents | Per box |
|---|---|---|---|
| **2** | $22 | $43 | **$22** |
| 3 | $33 | $32 | $11 |

**Two boxes is the right number.** $22 of contents is a real box — a decent
embroidered hat is $12–18 on its own. At three boxes you're down to $11 each,
which is a pin and a sticker, and it feels cheaper every time it lands.

**The birthday send works if it's small.** A card and a pin is roughly $3
including the stamp. That fits on top of two boxes. A third full box does not.

Note what this budget does *not* leave room for: profit, or an event. At $65
with two boxes you are spending essentially all of it. That's a fine decision —
see below — but make it on purpose.

### What 10 seats actually is
10 × $65 = **$650 a year, total.** This is not a revenue line. It's a goodwill
play: ten people who feel like owners and tell people about it. Judge it on
whether those ten bring you members, not on margin. The upside of 10 seats is
that the downside is capped at $650 — you can afford to be generous.

---

## Open questions

### 1. Lifetime is fine — because the seat cap caps it
Earning it through 3 referrals changes the shape of this. Lifetime can only
ever be held by a Founders member, and there are only 10 of those, so the
worst case is bounded:

| | |
|---|---|
| Most lifetime members that can ever exist | **10** |
| Upfront if all 10 take it | **$1,500** |
| Ongoing cost (10 × $47 of boxes) | **$470/yr** |
| Signups they had to bring first | **30** |

The $1,500 pays for the boxes through year 3. Year 4 is the first one out of
pocket, and from then it's −$470/yr at absolute worst — against 30 signups
that wouldn't exist otherwise. If even a handful of those 30 become Sendoff+
yearly members, the whole thing is positive.

**The one rule that protects this: lifetime stays exclusive to Founders Club.**
The moment it's offered to Sendoff+ referrers too, the member count is
unbounded and so is the cost. A capped liability and an uncapped one are
completely different promises, and they look identical on the page.

### 2. The event is gone from the budget
Earlier drafts had a yearly event (club night, dinner, yacht day). At $65 with
two boxes there's nothing left for it. Either drop it from the promise, or make
it something that costs you nothing — a dinner where everyone pays their own
way is still a good night and still a story.

### 3. The old team can't be in the perk
An earlier draft described the event as "with the sendoff founders team (me,
Oz, Issa)". They're out, and their names came off the site at their request.
The perk is an evening with **you**.

### 4. Nothing can take payment yet
There is no checkout. Stripe was never wired — the payment links in the old
code are empty strings. Stripe needs a business entity and a bank account on
file. Weeks, not a weekend.

### 5. Referrals and seats need accounts
Counting referrals, tracking the 10 seats, gating trips past the third — all of
it needs logins, which v1 deliberately doesn't have. The tiers and the account
system are one project; neither ships without the other.

### 6. Boxes make this an operations business
Two shipments a year still means addresses, a fulfilment partner, sales tax on
goods, and someone to handle a box that arrives broken. The software is the
easy half.

### 7. Is 3 trips enough to sell the upgrade?
Traffic lands from Instagram, sees three trips, hits a wall. Tight limits
create urgency, but they also have to show enough for the product to look worth
$4.99. Worth watching once there's traffic — it's a one-line change either way.

---

## Suggested order

1. **December**: signup page only. Build the list. *(done)*
2. **Measure**: how many signups, which cities, how many open the emails.
3. **Then Sendoff+ alone** — digital, so no shipping and no fulfilment. Stripe
   plus logins is the whole build.
4. **Founders Club last**, offered to the first 10 on a list that already
   exists. That's a better story than selling seats to an empty room.
