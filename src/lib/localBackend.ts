import { SEED_MEALS, SEED_PANTRY, SEED_SHOP } from "../data/seed";
import { isoDate, startOfToday } from "./format";
import type { Backend, Row, Table } from "./backend";
import type { Ingredient, Snapshot, Zone } from "./types";

const KEY = "na-talirku-demo-v1";
export const LOCAL_USER = "00000000-0000-4000-8000-000000000001";

const TABLE_KEY: Record<Table, keyof Snapshot> = {
  meals: "meals",
  ingredients: "ingredients",
  cook_log: "cookLog",
  shopping_items: "shop",
  hidden_ideas: "hiddenIdeas",
};

function seed(): Snapshot {
  const hid = crypto.randomUUID();
  const now = new Date().toISOString();
  const today = startOfToday();
  const ingredients: Ingredient[] = [];
  for (const [zone, items] of Object.entries(SEED_PANTRY) as [Zone, [string, Ingredient["state"]][]][]) {
    for (const [name, state] of items) ingredients.push({ id: crypto.randomUUID(), household_id: hid, name, zone, state, tracked: true });
  }
  const byName = new Map(ingredients.map((i) => [i.name, i]));
  const snap: Snapshot = {
    household: { id: hid, name: "Doma", invite_code: "ukazka", created_at: now },
    members: [{ user_id: LOCAL_USER, household_id: hid, display_name: "Já" }],
    meals: [],
    ingredients,
    mealIngredients: [],
    cookLog: [],
    hiddenIdeas: [],
    shop: SEED_SHOP.map((name) => ({ id: crypto.randomUUID(), household_id: hid, name, ingredient_id: null, for_meal_id: null, done: false, done_at: null, created_by: null, created_at: now })),
    photoUrls: {},
  };
  for (const m of SEED_MEALS) {
    const id = crypto.randomUUID();
    snap.meals.push({ id, household_id: hid, name: m.name, minutes: m.minutes, tags: m.tags, photo_path: null, created_at: now });
    for (const n of m.ingredients) {
      let ing = byName.get(n);
      if (!ing) {
        ing = { id: crypto.randomUUID(), household_id: hid, name: n, zone: "spiz", state: "doslo", tracked: true };
        ingredients.push(ing);
        byName.set(n, ing);
      }
      snap.mealIngredients.push({ meal_id: id, ingredient_id: ing.id });
    }
    snap.cookLog.push({ id: crypto.randomUUID(), household_id: hid, meal_id: id, cooked_on: isoDate(new Date(today.getTime() - m.lastDaysAgo * 864e5)), cooked_by: null });
  }
  return snap;
}

function read(): Snapshot {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Snapshot;
      s.hiddenIdeas ??= [];
      return s;
    }
  } catch {
    /* empty */
  }
  const s = seed();
  write(s);
  return s;
}

function write(s: Snapshot) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* empty */
  }
}

export function resetLocal() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* empty */
  }
}

export function localBackend(): Backend {
  const mutate = (fn: (s: Snapshot) => void) => {
    const s = read();
    fn(s);
    write(s);
  };
  const rowsOf = (s: Snapshot, t: Table) => s[TABLE_KEY[t]] as unknown as Row[];

  return {
    kind: "local",
    async load() {
      return read();
    },
    async insert(table, rows) {
      mutate((s) => rowsOf(s, table).push(...rows));
    },
    async update(table, id, patch) {
      mutate((s) => {
        const r = rowsOf(s, table).find((x) => x.id === id);
        if (r) Object.assign(r, patch);
      });
    },
    async remove(table, ids) {
      mutate((s) => {
        const k = TABLE_KEY[table];
        (s[k] as unknown as Row[]) = rowsOf(s, table).filter((x) => !ids.includes(x.id));
        if (table === "meals") {
          s.mealIngredients = s.mealIngredients.filter((x) => !ids.includes(x.meal_id));
          s.cookLog = s.cookLog.filter((x) => !ids.includes(x.meal_id));
          s.shop.forEach((x) => {
            if (x.for_meal_id && ids.includes(x.for_meal_id)) x.for_meal_id = null;
          });
        }
      });
    },
    async setMealIngredients(mealId, ingredientIds) {
      mutate((s) => {
        s.mealIngredients = s.mealIngredients.filter((x) => x.meal_id !== mealId).concat(ingredientIds.map((ingredient_id) => ({ meal_id: mealId, ingredient_id })));
      });
    },
    subscribe(_onChange, onStale) {
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY) onStale();
      };
      addEventListener("storage", onStorage);
      return () => removeEventListener("storage", onStorage);
    },
  };
}
