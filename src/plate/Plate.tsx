import { memo, useMemo, type ReactNode } from "react";
import { artKeyFor, cachedDish, defsMarkup, rimMarkup, wreathMarkup } from "./art";
import type { Meal } from "../lib/types";

export const PlateDefs = memo(function PlateDefs() {
  const html = useMemo(defsMarkup, []);
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs dangerouslySetInnerHTML={{ __html: html }} />
    </svg>
  );
});

interface PlateProps {
  meal: Pick<Meal, "id" | "name">;
  photoUrl?: string;
  size?: "sm" | "big";
}

export const Plate = memo(function Plate({ meal, photoUrl, size }: PlateProps) {
  const art = useMemo(() => (photoUrl ? "" : cachedDish(artKeyFor(meal.name), meal.id)), [photoUrl, meal.name, meal.id]);
  return (
    <span className={size ? `dish ${size}` : "dish"}>
      {photoUrl ? (
        <img className="plate photo" src={photoUrl} alt="" loading="lazy" decoding="async" />
      ) : (
        <svg className="plate" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
          <use href="#pbase" />
          <use href="#rim" />
          <g clipPath="url(#cWell)">
            <g transform="translate(100 100) scale(1.14) translate(-100 -100)" dangerouslySetInnerHTML={{ __html: art }} />
          </g>
        </svg>
      )}
    </span>
  );
});

const heroHtml = () => `<use href="#pbase"/>${rimMarkup()}`;

const CAPTION = "co máme doma \u00b7 co dokoupit \u00b7 co uvaříme";

export const HeroPlate = memo(function HeroPlate({ children, caption = true }: { children?: ReactNode; caption?: boolean }) {
  const plate = useMemo(heroHtml, []);
  const wreath = useMemo(wreathMarkup, []);
  return (
    <div className="stage">
      <div className="hero-scroll">
        <div className="plate-shadow" />
        <div className="hero-turn">
          <svg className="plate hero-spin" viewBox="0 0 200 200" aria-hidden="true" dangerouslySetInnerHTML={{ __html: plate }} />
        </div>
        <svg className="wreath" viewBox="0 0 200 200" aria-hidden="true" dangerouslySetInnerHTML={{ __html: wreath }} />
        {caption && (
          <svg className="caption" viewBox="0 0 200 200" aria-hidden="true">
            <path id="caption-arc" d="M11 100A89 89 0 0 0 189 100" fill="none" />
            <text>
              <textPath href="#caption-arc" startOffset="50%" textAnchor="middle">
                {CAPTION}
              </textPath>
            </text>
          </svg>
        )}
        {children}
      </div>
    </div>
  );
});

export function Stitch() {
  return (
    <div className="stitch-wrap" aria-hidden="true">
      <svg className="stitch">
        <rect width="100%" height="100%" />
      </svg>
      <div className="stitch-cover" />
    </div>
  );
}
