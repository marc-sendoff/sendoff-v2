import React from "react";
import { m } from "motion/react";
import { SPRING } from "../../theme.js";
import { fmt } from "../../data/config.js";
import { priceTag } from "@/data/pricing.js";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* TripCard v3 — same card, new substrate: shadcn Card + Badge carry the
   surface, the media tile uses the published Kokonut hover-zoom pattern
   (transform-only), and the motion contract is IDENTICAL to v2 (layout glide
   on filter changes, per-row stagger, y-lift hover). Data, props, and the
   badge rule are unchanged. */
export const TripCardV3 = React.forwardRef(function TripCardV3({ trip, i, mode, over, onOpen, locked = false }, ref) {
  const badge = trip.cheapest
    ? { text: "CHEAPEST SEND", cls: "bg-foreground text-secondary" }
    : trip.cost >= 1200 ? { text: "STRETCH GOAL", cls: "bg-destructive text-white" } : null;
  /* A locked card is a teaser, not a wall: the card shape and colour survive so
     the send still tempts, the contents blur, and the click opens the paywall
     instead of the trip sheet. The lock badge sits above the blur. */
  const veil = locked ? { filter: "blur(7px)", userSelect: "none" } : undefined;
  return (
    <m.button ref={ref} onClick={() => onOpen(trip)}
      aria-label={locked ? `${trip.name} — locked, unlock with Sendoff+` : undefined}
      layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: over ? 0.85 : 1, y: 0 }}
      transition={{ ...SPRING, delay: Math.min(i % 6, 5) * 0.045 }}
      whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
      className="sendoff-v3 group cursor-pointer text-left">
      <Card className="relative flex h-full w-full flex-col gap-0 overflow-hidden rounded-2xl border-2 border-border p-0 font-sans text-foreground shadow-[4px_4px_0_var(--border)]">
        {locked && (
          <span aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-[34px]">
            🔒
          </span>
        )}
        <div
          className="relative flex aspect-[5/3] w-full items-center justify-center overflow-hidden border-b-2 border-border"
          style={{ ...veil, background: trip.color }}>
          {trip.photo ? (
            <img src={trip.photo} alt="" loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <span aria-hidden="true"
              className="text-[56px] [filter:drop-shadow(0_3px_0_rgba(27,29,42,0.18))]">{trip.img}</span>
          )}
          <span className="absolute top-2.5 right-2.5 rounded-[10px] border-2 border-border bg-card px-2.5 py-[5px] text-center font-display text-[15px] font-extrabold leading-none">
            {fmt(trip.cost)}
            <span className="mt-0.5 block text-[9.5px] font-semibold">/person · {priceTag(trip)}</span>
          </span>
          {badge && (
            <Badge className={`absolute bottom-2.5 left-3 rounded-full border-2 border-border px-2.5 py-1 text-[10.5px] font-extrabold tracking-[0.4px] ${badge.cls}`}>
              {badge.text}
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 px-4 pt-3.5 pb-4" style={veil}>
          <div className="font-display text-xl font-extrabold leading-[1.12] tracking-[-0.3px]">{trip.name}</div>
          <div className="text-[13px] font-bold text-primary">{trip.tag}</div>
          <div className="mt-auto pt-1.5 text-[12.5px] font-semibold opacity-[0.68]">
            {trip.days} {trip.days === 1 ? "day" : "days"} · {mode}
          </div>
          {over && (
            <div className="text-xs font-extrabold text-destructive">↑ above your current budget</div>
          )}
        </div>
      </Card>
    </m.button>
  );
});
