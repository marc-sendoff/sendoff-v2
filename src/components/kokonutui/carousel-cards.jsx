/**
 * @author: @dorianbaffier
 * @description: Carousel Cards
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 *
 * Sendoff adaptations (copy-in per the shadcn registry model; published
 * structure and classes preserved): next/image -> <img>, next/link ->
 * <button> (cards open in-app, not by href), demo data removed in favor of
 * props, emoji-tile fallback branch for photoless items, optional
 * oldPrice/meta fields for deal pricing (a deal's price renders prominent,
 * cobalt), titleExtra/trailing slots so brand badges and CTA tiles can ride
 * in the header/row, cardClassName pass-through for brand skinning, Heart
 * appears only when onFavorite is wired, and hover:shadow-md dropped from
 * the card (founder rule: hover effects are transform-only — the image zoom
 * carries the hover).
 */

import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export const ExperienceCard = ({ experience, onFavorite, cardClassName }) => (
  <Card
    className={`group relative flex h-[320px] w-full flex-col overflow-hidden rounded-xl border-0 py-0 shadow-sm ${cardClassName || ""}`}>
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl">
      {experience.image ? (
        <img
          alt={experience.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          src={experience.image} />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center text-5xl"
          style={{ background: experience.tileColor || "var(--muted)" }}>
          {experience.emoji || "✨"}
        </div>
      )}
      {onFavorite && (
        <Button
          className="absolute top-2 right-2 z-10 rounded-full bg-white/80 text-neutral-700 backdrop-blur-sm hover:bg-white/90 hover:text-black"
          onClick={(e) => { e.stopPropagation(); onFavorite(experience); }}
          size="icon"
          variant="ghost">
          <Heart className="h-4 w-4 stroke-[2px]" />
          <span className="sr-only">Add to favorites</span>
        </Button>
      )}
      {experience.badge && (
        <Badge
          className="absolute top-2 left-2 rounded-full border-2 border-border bg-secondary px-2.5 py-1 font-sans text-[11px] font-extrabold tracking-[0.3px] text-secondary-foreground">
          {experience.badge}
        </Badge>
      )}
    </div>

    <div className="flex flex-1 flex-col justify-between">
      <CardContent className="p-2 pt-3 pb-0">
        <h3 className="font-display text-[17px] font-extrabold leading-tight tracking-[-0.3px] text-foreground">
          {experience.title}
        </h3>
        <p className="mt-0.5 font-sans text-[12.5px] font-bold text-primary">
          {experience.location}
        </p>
        {experience.date && (
          <p className="font-sans text-[12px] font-semibold text-foreground/70">
            {experience.date}
          </p>
        )}
      </CardContent>

      <CardFooter className="mt-auto flex items-center gap-0.5 p-2 pt-0 text-xs">
        {experience.rating && (
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-current" />
            {experience.rating}
          </span>
        )}
        {experience.meta && (
          <span className="font-sans text-[12px] font-semibold text-foreground/70">
            {experience.meta}
          </span>
        )}
        <span className={experience.oldPrice
          ? "ml-auto font-display text-[18px] font-extrabold tracking-[-0.3px] text-foreground"
          : "ml-auto font-sans text-xs font-semibold"}>
          {experience.oldPrice && (
            <span className="mr-1.5 font-sans text-xs font-semibold text-foreground/50 line-through">
              {experience.oldPrice}
            </span>
          )}
          {experience.price}
          {experience.priceSuffix ? ` ${experience.priceSuffix}` : ""}
        </span>
      </CardFooter>
    </div>
  </Card>
);

export const ExperienceSection = ({ title, titleExtra, items, onSelect, onFavorite, trailing, cardClassName }) => {
  const scrollContainer = React.useRef(null);

  const handleScrollLeft = () => {
    if (scrollContainer.current) {
      scrollContainer.current.scrollBy({
        left: -320,
        behavior: "smooth",
      });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainer.current) {
      scrollContainer.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full py-4">
      <div className="mx-auto max-w-[1760px]">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-medium text-lg tracking-tight md:text-xl">
            {title}
          </h2>
          <div className="flex items-center gap-1">
            {titleExtra}
            <Button
              className="h-7 w-7 rounded-full border-neutral-200 hover:bg-neutral-100"
              onClick={handleScrollLeft}
              size="icon"
              variant="outline">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Scroll left</span>
            </Button>
            <Button
              className="h-7 w-7 rounded-full border-neutral-200 hover:bg-neutral-100"
              onClick={handleScrollRight}
              size="icon"
              variant="outline">
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Scroll right</span>
            </Button>
          </div>
        </div>

        <div
          className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2"
          ref={scrollContainer}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}>
          {items.map((item) => (
            <div className="w-[240px] flex-none snap-start md:w-[260px]" key={item.id}>
              <button
                className="block w-full cursor-pointer rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => onSelect?.(item)}
                type="button">
                <ExperienceCard experience={item} onFavorite={onFavorite} cardClassName={cardClassName} />
              </button>
            </div>
          ))}
          {trailing}
        </div>
      </div>
    </div>
  );
};
