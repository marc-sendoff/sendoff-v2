import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/* Vibe filter rail v3 — the pill row becomes a real single-select
   ToggleGroup (shadcn/Radix: roving tabindex, aria-pressed for free),
   styled to the same ink-pill look as the v2 chips. */
export function VibeRail({ vibes, vibe, setVibe }) {
  return (
    <ToggleGroup
      type="single"
      value={vibe}
      onValueChange={(v) => v && setVibe(v)}
      aria-label="Filter by vibe"
      className="sendoff-v3 flex w-full justify-start gap-2">
      {vibes.map((v) => (
        <ToggleGroupItem
          key={v.id}
          value={v.id}
          className="h-auto shrink-0 flex-none grow-0 whitespace-nowrap rounded-full border-2 border-border bg-card px-[15px] py-2 font-sans text-sm font-bold text-foreground hover:bg-card hover:text-foreground data-[spacing=0]:rounded-full data-[spacing=0]:first:rounded-full data-[spacing=0]:last:rounded-full data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:hover:bg-foreground data-[state=on]:hover:text-background">
          {v.emoji} {v.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
