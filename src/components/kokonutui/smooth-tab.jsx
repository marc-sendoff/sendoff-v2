/**
 * @author: @dorianbaffier
 * @description: Smooth Tab
 * @version: 1.0.0
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 *
 * Sendoff adaptations (copy-in per the shadcn registry model): the published
 * component pairs this segmented toolbar with a demo content panel; the panel
 * is dropped (the trips grid is the "panel"). `motion` becomes `m` to live
 * under the app's strict LazyMotion, and the tab strip is controllable via
 * `value`. The sliding pill uses motion.dev's published layoutId pattern
 * (their documented tabs recipe) instead of the original
 * getBoundingClientRect + resize-listener measurement: layout comes from CSS,
 * so the pill is always under the active tab even before any animation frame
 * runs, and the same spring drives the slide. Toolbar structure, classes, and
 * keyboard handling are as published.
 */
import { m } from "motion/react";
import * as React from "react";
import { cn } from "@/lib/utils";

export default function SmoothTab({
  items,
  value,
  defaultTabId,
  className,
  activeColor = "bg-primary",
  onChange
}) {
  const [internal, setInternal] = React.useState(defaultTabId ?? items[0]?.id);
  const selected = value ?? internal;

  const handleTabClick = (tabId) => {
    setInternal(tabId);
    onChange?.(tabId);
  };

  const handleKeyDown = (e, tabId) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTabClick(tabId);
    }
  };

  return (
    <div
      aria-label="Smooth tabs"
      className={cn(
        "relative mt-auto flex items-center justify-between gap-1 py-1",
        "bg-background",
        "rounded-xl border",
        "transition-all duration-200",
        className
      )}
      role="tablist">
      <div
        className="relative z-[2] grid w-full gap-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const isSelected = selected === item.id;
          return (
            <m.button
              aria-selected={isSelected}
              className={cn(
                "relative flex items-center justify-center gap-0.5 rounded-lg px-2 py-1.5",
                "font-medium text-sm transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "truncate",
                isSelected
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              id={`tab-${item.id}`}
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              role="tab"
              tabIndex={isSelected ? 0 : -1}
              type="button">
              {isSelected && (
                <m.span
                  layoutId="smooth-tab-pill"
                  className={cn("absolute inset-0 rounded-lg", item.color || activeColor)}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <span className="relative z-[1] truncate">{item.title}</span>
            </m.button>
          );
        })}
      </div>
    </div>
  );
}
