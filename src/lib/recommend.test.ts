import { describe, expect, it } from "vitest";
import { recommend, score } from "./recommend";
import { ago, minutes, tidy, NB } from "./format";
import type { Meal, Tag } from "./types";

const meal = (id: string, mins: number, tags: Tag[] = []): Meal => ({ id, household_id: "h", name: id, minutes: mins, tags, photo_path: null, created_at: "" });

describe("score", () => {
  it("follows the formula and caps days at 45", () => {
    expect(score({ coverage: 1, daysSince: 10 }, 0)).toBeCloseTo(55 + 9);
    expect(score({ coverage: 0.5, daysSince: 100 }, 1)).toBeCloseTo(27.5 + 40.5 + 22);
    expect(score({ coverage: 0, daysSince: null }, 0)).toBeCloseTo(40.5);
  });
});

describe("recommend", () => {
  const meals = [meal("a", 20, ["rychle"]), meal("b", 50), meal("c", 120, ["vikend"]), meal("d", 25, ["polevka"]), meal("e", 30), meal("f", 15)];
  const days: Record<string, number | null> = { a: 10, b: 20, c: 30, d: 1, e: 0, f: 40 };
  const facts = (m: Meal) => ({ coverage: 1, daysSince: days[m.id] });

  it("drops meals cooked today or yesterday and respects time", () => {
    const picks = recommend(meals, facts, { time: 60, mood: "any" }, [], () => 0);
    expect(picks.map((m) => m.id)).toEqual(["f", "b", "a"]);
  });

  it("filters by mood", () => {
    const picks = recommend(meals, facts, { time: 999, mood: "vikend" }, [], () => 0);
    expect(picks.map((m) => m.id)).toEqual(["c"]);
  });

  it("skips previous picks when enough remain", () => {
    const more = [...meals, meal("g", 10), meal("h", 10), meal("i", 10)];
    const f = (m: Meal) => ({ coverage: 1, daysSince: days[m.id] ?? 5 });
    const first = recommend(more, f, { time: 999, mood: "any" }, [], () => 0).map((m) => m.id);
    const second = recommend(more, f, { time: 999, mood: "any" }, first, () => 0).map((m) => m.id);
    expect(second.some((id) => first.includes(id))).toBe(false);
  });
});

describe("format", () => {
  it("binds one-letter prepositions", () => {
    expect(tidy("Řízek s bramborovým salátem")).toBe(`Řízek s${NB}bramborovým salátem`);
    expect(tidy("v lednici a k obědu")).toBe(`v${NB}lednici a k${NB}obědu`);
  });
  it("formats time and age", () => {
    expect(minutes(30)).toBe(`30${NB}min`);
    expect(minutes(150)).toBe(`2${NB}h 30${NB}min`);
    expect(ago(1)).toBe("včera");
    expect(ago(14)).toBe(`před 2${NB}týdny`);
    expect(ago(null)).toBe("zatím nikdy");
  });
});
