import React from "react";
import { Input } from "@/components/ui/input";
import SmoothTab from "@/components/kokonutui/smooth-tab";

const SORTS = [
  { id: "best", title: "Best match" },
  { id: "low", title: "$ Low → High" },
  { id: "high", title: "$ High → Low" },
  { id: "close", title: "Closest" },
];

/* Live all-in ranking, only offered when data for this origin exists —
   the tab appearing IS the signal that live prices are in. */
const LIVE_SORT = { id: "cheaplive", title: "⚡ Live prices" };

/* Search + sort v3 — shadcn Input for the query, Kokonut SmoothTab (its
   published sliding-pill toolbar) replaces the <select>: all four sort
   choices visible, one spring, no dropdown. */
export function SearchSortBar({ query, setQuery, sortBy, setSortBy, liveSort }) {
  const items = liveSort ? [...SORTS, LIVE_SORT] : SORTS;
  return (
    <div className="sendoff-v3 mb-3.5 flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[240px] flex-1 basis-[240px]">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a place · Tokyo, beach, Europe…"
          className="h-11 rounded-full border-2 border-input bg-card px-3.5 pr-9 font-sans text-base font-semibold text-foreground shadow-none md:text-base" />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search"
            className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer border-0 bg-transparent text-base font-extrabold text-foreground">✕</button>
        )}
      </div>
      <SmoothTab
        items={items}
        value={sortBy}
        onChange={setSortBy}
        activeColor="bg-primary"
        className={`w-full flex-none rounded-full border-2 border-border bg-card sm:w-auto ${liveSort ? "sm:min-w-[540px]" : "sm:min-w-[420px]"}`} />
    </div>
  );
}
