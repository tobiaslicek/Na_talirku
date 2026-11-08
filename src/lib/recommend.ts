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

export interface IdeaFacts {
  taste: number;
  coverage: number;
}

export function ideaScore(f: IdeaFacts, random: number) {
  return f.taste * 45 + f.coverage * 35 + random * 30;
}

export function recommendIdeas<T extends { id: string; minutes: number; tags: Tag[] }>(
  ideas: T[],
  facts: (i: T) => IdeaFacts,
  prefs: Prefs,
  exclude: string[] = [],
  count = 3,
  random: () => number = Math.random,
): T[] {
  if (count <= 0) return [];
  let pool = ideas.filter((i) => i.minutes <= prefs.time && (prefs.mood === "any" || i.tags.includes(prefs.mood)));
  const fresh = pool.filter((i) => !exclude.includes(i.id));
  if (fresh.length >= count) pool = fresh;
  return pool
    .map((i) => ({ i, s: ideaScore(facts(i), random()) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .map((x) => x.i);
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
