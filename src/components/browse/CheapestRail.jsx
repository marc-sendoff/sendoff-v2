import React from "react";
import { m } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TRIPS } from "@/data/trips.js";
import { fmt } from "@/data/config.js";

/* "Cheapest actual sends right now" — the ranked answer to every fare-alert
   tool: total trip cost per person (flight + our on-ground budget) for THIS
   crew, not fare anomalies to nowhere. Data arrives via utils/cheapest.js
   (live endpoint -> fixture -> null); when it's null the caller renders
   nothing, so this component can assume a valid, ascending-sorted payload.
   Substrate rules: shadcn Card/Badge as published, Tailwind tokens, hovers
   transform-only, .sendoff-v3 on the root. */
const showDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function CheapestRail({ data, origin, crew, onOpenTrip }) {
  if (!data) return null;
  const rows = data.results
    .map((r) => ({ ...r, trip: TRIPS.find((t) => t.id === r.tripId) }))
    .filter((r) => r.trip)
    .slice(0, 5);
  if (!rows.length) return null;
  return (
    <section className="sendoff-v3 mx-auto mt-4 w-full max-w-[960px] px-5">
      <div className="mb-2.5 text-[11.5px] font-extrabold tracking-[1.4px] text-primary uppercase">
        Cheapest right now
      </div>
      <Card className="gap-0 rounded-2xl border-2 border-border bg-card py-0 shadow-[4px_4px_0_var(--border)]">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-baseline gap-x-2 px-4 pt-3.5 pb-1">
            <span className="font-display text-lg font-extrabold">
              Cheapest actual sends from {origin}
            </span>
            <span className="text-xs font-semibold text-foreground/60">
              flights + on the ground, per person, for your crew of {data.crew}
              {data.stale && data.updatedAt ? ` · prices from ${showDate(data.updatedAt)}` : ""}
            </span>
          </div>
          <ol className="m-0 list-none p-0">
            {rows.map((r, i) => (
              <m.li key={r.tripId} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.045 }}
                className={i > 0 ? "border-t border-border/20" : ""}>
                <m.button type="button" onClick={() => onOpenTrip(r.trip)}
                  whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}
                  className="flex w-full cursor-pointer items-center gap-3 bg-transparent px-4 py-2.5 text-left font-sans text-foreground">
                  <span className="w-6 flex-none text-center font-display text-base font-extrabold text-foreground/40">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-extrabold">
                      {r.trip.img} {r.trip.name}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-foreground/60">
                      {fmt(r.farePerPerson)} round-trip flights + {fmt(r.groundPerPerson)} on the ground
                    </span>
                  </span>
                  <Badge className="hidden flex-none rounded-full border-2 border-border bg-secondary font-display text-[11px] font-extrabold text-foreground sm:inline-flex">
                    {r.days} days
                  </Badge>
                  <span className="flex-none text-right">
                    <span className="block font-display text-[17px] font-extrabold">
                      {fmt(r.totalPerPerson)}<span className="text-[11px] opacity-60">/person</span>
                    </span>
                    <span className="block text-[11px] font-bold text-foreground/55">
                      {fmt(r.totalCrew)} for the crew
                    </span>
                  </span>
                </m.button>
              </m.li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}
