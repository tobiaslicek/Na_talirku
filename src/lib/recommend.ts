import type { Meal, Tag } from "./types";

export type TimePref = 30 | 60 | 999;
export type MoodPref = Tag | "any";

export interface Prefs {
  time: TimePref;
  mood: MoodPref;
}

export interface MealFacts {
  coverage: number;
  daysSince: number | null;
}

const MAX_DAYS = 45;

export function score(f: MealFacts, random: number) {
  const days = Math.min(f.daysSince ?? MAX_DAYS, MAX_DAYS);
  return f.coverage * 55 + days * 0.9 + random * 22;
}

export function recommend(
  meals: Meal[],
  facts: (m: Meal) => MealFacts,
  prefs: Prefs,
  exclude: string[] = [],
  random: () => number = Math.random,
): Meal[] {
  let pool = meals.filter((m) => {
    if (m.minutes > prefs.time) return false;
    if (prefs.mood !== "any" && !m.tags.includes(prefs.mood)) return false;
    const d = facts(m).daysSince;
    return d === null || d > 1;
  });
  const fresh = pool.filter((m) => !exclude.includes(m.id));
  if (fresh.length >= 3) pool = fresh;
  return pool
    .map((m) => ({ m, s: score(facts(m), random()) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map((x) => x.m);
}
