import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type { Backend, Change, Row, Table } from "./backend";
import { daysSince, isoDate } from "./format";
import type { CookLog, Ingredient, IngredientState, Meal, ShoppingItem, Snapshot, Tag, Zone } from "./types";

type Action = { type: "replace"; snap: Snapshot } | { type: "change"; change: Change } | { type: "mealIngredients"; mealId: string; ids: string[] };

const KEYS: Record<Table, "meals" | "ingredients" | "cookLog" | "shop"> = {
  meals: "meals",
  ingredients: "ingredients",
  cook_log: "cookLog",
  shopping_items: "shop",
};

function reducer(s: Snapshot | null, a: Action): Snapshot | null {
  if (a.type === "replace") return a.snap;
  if (!s) return s;
  if (a.type === "mealIngredients") {
    return { ...s, mealIngredients: s.mealIngredients.filter((x) => x.meal_id !== a.mealId).concat(a.ids.map((ingredient_id) => ({ meal_id: a.mealId, ingredient_id }))) };
  }
  const c = a.change;
  const k = KEYS[c.table];
  const rows = s[k] as unknown as Row[];
  let next: Row[];
  if (c.type === "delete") {
    next = rows.filter((r) => !c.ids.includes(r.id));
  } else {
    next = rows.slice();
    for (const row of c.rows) {
      const i = next.findIndex((r) => r.id === row.id);
      if (i >= 0) next[i] = { ...next[i], ...row };
      else next.push(row);
    }
  }
  const out = { ...s, [k]: next } as Snapshot;
  if (c.type === "delete" && c.table === "meals") {
    out.mealIngredients = s.mealIngredients.filter((x) => !c.ids.includes(x.meal_id));
    out.cookLog = s.cookLog.filter((x) => !c.ids.includes(x.meal_id));
  }
  return out;
}

export interface MealInput {
  id?: string;
  name: string;
  minutes: number;
  tags: Tag[];
  ingredientNames: string[];
}

export interface StockRow {
  name: string;
  zone: Zone;
}

export interface StockResult {
  added: number;
  restocked: number;
  bought: number;
}

export interface Store {
  snap: Snapshot;
  userId: string | null;
  backendKind: Backend["kind"];
  lastCooked: (mealId: string) => string | null;
  daysSinceCooked: (mealId: string) => number | null;
  ingredientsOf: (mealId: string) => Ingredient[];
  missingOf: (mealId: string) => Ingredient[];
  coverageOf: (mealId: string) => number;
  historyOf: (mealId: string) => CookLog[];
  mealById: (id: string) => Meal | undefined;
  openShop: ShoppingItem[];
  cook: (mealId: string) => Promise<string[]>;
  addMissingToShop: (mealId: string) => Promise<string[]>;
  addLowToShop: () => Promise<string[]>;
  addShopItem: (name: string) => Promise<boolean>;
  toggleShop: (id: string, done: boolean) => Promise<Ingredient | null>;
  clearDone: () => Promise<void>;
  cycleIngredient: (id: string) => Promise<void>;
  saveMeal: (input: MealInput) => Promise<string>;
  deleteMeal: (id: string) => Promise<void>;
  deleteCook: (id: string) => Promise<void>;
  mealsUsing: (ingredientId: string) => Meal[];
  findIngredient: (name: string) => Ingredient | undefined;
  addIngredient: (input: { name: string; zone: Zone; state: IngredientState }) => Promise<boolean>;
  updateIngredient: (id: string, patch: Partial<Pick<Ingredient, "name" | "zone" | "state" | "tracked">>) => Promise<boolean>;
  removeIngredient: (id: string) => Promise<void>;
  stockPantry: (rows: StockRow[]) => Promise<StockResult>;
}

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

const NEXT_STATE: Record<IngredientState, IngredientState> = { mame: "dochazi", dochazi: "doslo", doslo: "mame" };
export const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function StoreProvider({ backend, userId, onError, fallback, children }: { backend: Backend; userId: string | null; onError: (e: unknown) => void; fallback: ReactNode; children: ReactNode }) {
  const [snap, dispatch] = useReducer(reducer, null);
  const snapRef = useRef<Snapshot | null>(null);
  snapRef.current = snap;

  const reload = useCallback(async () => {
    try {
      dispatch({ type: "replace", snap: await backend.load() });
    } catch (e) {
      onError(e);
    }
  }, [backend, onError]);

  useEffect(() => {
    reload();
    return backend.subscribe((change) => dispatch({ type: "change", change }), reload);
  }, [backend, reload]);

  const run = useCallback(
    async (work: () => Promise<void>) => {
      try {
        await work();
      } catch (e) {
        onError(e);
        await reload();
      }
    },
    [onError, reload],
  );

  const derived = useMemo(() => {
    if (!snap) return null;
    const last = new Map<string, string>();
    const history = new Map<string, CookLog[]>();
    for (const c of snap.cookLog) {
      const cur = last.get(c.meal_id);
      if (!cur || c.cooked_on > cur) last.set(c.meal_id, c.cooked_on);
      const h = history.get(c.meal_id) ?? [];
      h.push(c);
      history.set(c.meal_id, h);
    }
    history.forEach((h) => h.sort((a, b) => b.cooked_on.localeCompare(a.cooked_on)));
    const ingById = new Map(snap.ingredients.map((i) => [i.id, i]));
    const ings = new Map<string, Ingredient[]>();
    for (const mi of snap.mealIngredients) {
      const i = ingById.get(mi.ingredient_id);
      if (!i) continue;
      const arr = ings.get(mi.meal_id) ?? [];
      arr.push(i);
      ings.set(mi.meal_id, arr);
    }
    const mealById = new Map(snap.meals.map((m) => [m.id, m]));
    return { last, history, ings, mealById, openShop: snap.shop.filter((x) => !x.done) };
  }, [snap]);

  const store = useMemo<Store | null>(() => {
    if (!snap || !derived) return null;
    const hid = snap.household.id;
    const ingredientsOf = (id: string) => derived.ings.get(id) ?? [];
    const missingOf = (id: string) => ingredientsOf(id).filter((i) => i.state === "doslo");
    const now = () => new Date().toISOString();

    const shopRow = (name: string, ingredient_id: string | null, for_meal_id: string | null): ShoppingItem => ({
      id: crypto.randomUUID(),
      household_id: hid,
      name,
      ingredient_id,
      for_meal_id,
      done: false,
      done_at: null,
      created_by: userId,
      created_at: now(),
    });

    const insert = async (table: Table, rows: Row[]) => {
      if (!rows.length) return;
      dispatch({ type: "change", change: { type: "upsert", table, rows } });
      await backend.insert(table, rows);
    };
    const update = async (table: Table, id: string, patch: Record<string, unknown>) => {
      dispatch({ type: "change", change: { type: "upsert", table, rows: [{ id, ...patch }] } });
      await backend.update(table, id, patch);
    };
    const remove = async (table: Table, ids: string[]) => {
      if (!ids.length) return;
      dispatch({ type: "change", change: { type: "delete", table, ids } });
      await backend.remove(table, ids);
    };

    const addIngredientsToShop = async (items: Ingredient[], forMeal: string | null) => {
      const open = (snapRef.current?.shop ?? []).filter((x) => !x.done);
      const fresh = items.filter((i) => !open.some((x) => x.ingredient_id === i.id || norm(x.name) === norm(i.name)));
      await insert("shopping_items", fresh.map((i) => shopRow(i.name, i.id, forMeal)) as unknown as Row[]);
      return fresh.map((i) => i.name);
    };

    return {
      snap,
      userId,
      backendKind: backend.kind,
      lastCooked: (id) => derived.last.get(id) ?? null,
      daysSinceCooked: (id) => daysSince(derived.last.get(id)),
      ingredientsOf,
      missingOf,
      coverageOf: (id) => {
        const all = ingredientsOf(id);
        return all.length ? (all.length - missingOf(id).length) / all.length : 1;
      },
      historyOf: (id) => derived.history.get(id) ?? [],
      mealById: (id) => derived.mealById.get(id),
      openShop: derived.openShop,

      async cook(mealId) {
        const miss = missingOf(mealId);
        let added: string[] = [];
        await run(async () => {
          const row: CookLog = { id: crypto.randomUUID(), household_id: hid, meal_id: mealId, cooked_on: isoDate(new Date()), cooked_by: userId };
          await insert("cook_log", [row as unknown as Row]);
          added = await addIngredientsToShop(miss, mealId);
        });
        return added;
      },

      async addMissingToShop(mealId) {
        let added: string[] = [];
        await run(async () => {
          added = await addIngredientsToShop(missingOf(mealId), mealId);
        });
        return added;
      },

      async addLowToShop() {
        let added: string[] = [];
        await run(async () => {
          added = await addIngredientsToShop(snap.ingredients.filter((i) => i.state === "dochazi"), null);
        });
        return added;
      },

      async addShopItem(raw) {
        const name = raw.trim().toLowerCase();
        if (!name) return false;
        const open = (snapRef.current?.shop ?? []).filter((x) => !x.done);
        if (open.some((x) => norm(x.name) === norm(name))) return false;
        const ing = snap.ingredients.find((i) => norm(i.name) === norm(name)) ?? null;
        await run(() => insert("shopping_items", [shopRow(ing?.name ?? name, ing?.id ?? null, null) as unknown as Row]));
        return true;
      },

      async toggleShop(id, done) {
        const item = snap.shop.find((x) => x.id === id);
        if (!item) return null;
        const ing = done && item.ingredient_id ? snap.ingredients.find((i) => i.id === item.ingredient_id) ?? null : null;
        await run(async () => {
          await update("shopping_items", id, { done, done_at: done ? now() : null });
          if (ing && ing.state !== "mame") await update("ingredients", ing.id, { state: "mame" });
        });
        return ing;
      },

      async clearDone() {
        await run(() => remove("shopping_items", snap.shop.filter((x) => x.done).map((x) => x.id)));
      },

      async cycleIngredient(id) {
        const ing = snap.ingredients.find((i) => i.id === id);
        if (!ing) return;
        await run(() => update("ingredients", id, { state: NEXT_STATE[ing.state] }));
      },

      async saveMeal(input) {
        const id = input.id ?? crypto.randomUUID();
        await run(async () => {
          const ids: string[] = [];
          const fresh: Ingredient[] = [];
          for (const raw of input.ingredientNames) {
            const n = norm(raw);
            if (!n) continue;
            const found = snap.ingredients.find((i) => norm(i.name) === n) ?? fresh.find((i) => norm(i.name) === n);
            if (found) {
              if (!ids.includes(found.id)) ids.push(found.id);
              continue;
            }
            const ing: Ingredient = { id: crypto.randomUUID(), household_id: hid, name: n, zone: "spiz", state: "mame", tracked: true };
            fresh.push(ing);
            ids.push(ing.id);
          }
          await insert("ingredients", fresh as unknown as Row[]);
          const fields = { name: input.name.trim(), minutes: input.minutes, tags: input.tags };
          if (input.id) await update("meals", id, fields);
          else await insert("meals", [{ id, household_id: hid, photo_path: null, created_at: now(), ...fields } as unknown as Row]);
          dispatch({ type: "mealIngredients", mealId: id, ids });
          await backend.setMealIngredients(id, ids);
        });
        return id;
      },

      async deleteMeal(id) {
        await run(() => remove("meals", [id]));
      },

      async deleteCook(id) {
        await run(() => remove("cook_log", [id]));
      },

      mealsUsing(ingredientId) {
        const ids = new Set(snap.mealIngredients.filter((x) => x.ingredient_id === ingredientId).map((x) => x.meal_id));
        return snap.meals.filter((m) => ids.has(m.id));
      },

      findIngredient(name) {
        const n = norm(name);
        return snap.ingredients.find((i) => norm(i.name) === n);
      },

      async addIngredient({ name, zone, state }) {
        const n = norm(name);
        if (!n) return false;
        const existing = snap.ingredients.find((i) => norm(i.name) === n);
        if (existing) {
          if (existing.tracked) return false;
          await run(() => update("ingredients", existing.id, { tracked: true, zone, state }));
          return true;
        }
        const row: Ingredient = { id: crypto.randomUUID(), household_id: hid, name: n, zone, state, tracked: true };
        await run(() => insert("ingredients", [row as unknown as Row]));
        return true;
      },

      async updateIngredient(id, patch) {
        if (patch.name !== undefined) {
          const n = norm(patch.name);
          if (!n || snap.ingredients.some((i) => i.id !== id && norm(i.name) === n)) return false;
          patch = { ...patch, name: n };
        }
        await run(() => update("ingredients", id, patch));
        return true;
      },

      async removeIngredient(id) {
        const used = snap.mealIngredients.some((x) => x.ingredient_id === id);
        await run(() => (used ? update("ingredients", id, { tracked: false }) : remove("ingredients", [id])));
      },

      async stockPantry(rows) {
        const result: StockResult = { added: 0, restocked: 0, bought: 0 };
        await run(async () => {
          const touched: Ingredient[] = [];
          const fresh: Ingredient[] = [];
          for (const r of rows) {
            const n = norm(r.name);
            if (!n || touched.some((t) => norm(t.name) === n)) continue;
            const existing = snap.ingredients.find((i) => norm(i.name) === n);
            if (existing) {
              const patch: Record<string, unknown> = { state: "mame", tracked: true };
              if (!existing.tracked || existing.zone !== r.zone) patch.zone = r.zone;
              await update("ingredients", existing.id, patch);
              touched.push(existing);
              result.restocked++;
            } else {
              const ing: Ingredient = { id: crypto.randomUUID(), household_id: hid, name: n, zone: r.zone, state: "mame", tracked: true };
              fresh.push(ing);
              touched.push(ing);
              result.added++;
            }
          }
          await insert("ingredients", fresh as unknown as Row[]);
          const open = (snapRef.current?.shop ?? []).filter((x) => !x.done);
          for (const item of open) {
            const hit = touched.find((t) => t.id === item.ingredient_id || norm(t.name) === norm(item.name));
            if (!hit) continue;
            await update("shopping_items", item.id, { done: true, done_at: now() });
            result.bought++;
          }
        });
        return result;
      },
    };
  }, [snap, derived, backend, userId, run]);

  if (!store) return <>{fallback}</>;
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
