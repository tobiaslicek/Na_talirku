import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Snapshot } from "./types";

export type Table = "meals" | "ingredients" | "cook_log" | "shopping_items" | "idea_votes";
export type Row = { id: string } & Record<string, unknown>;

export type Change =
  | { type: "upsert"; table: Table; rows: Row[] }
  | { type: "delete"; table: Table; ids: string[] };

export interface Backend {
  readonly kind: "supabase" | "local";
  load(): Promise<Snapshot>;
  insert(table: Table, rows: Row[]): Promise<void>;
  update(table: Table, id: string, patch: Record<string, unknown>): Promise<void>;
  remove(table: Table, ids: string[]): Promise<void>;
  setMealIngredients(mealId: string, ingredientIds: string[]): Promise<void>;
  subscribe(onChange: (c: Change) => void, onStale: () => void): () => void;
}

const PHOTO_BUCKET = "meal-photos";

export function supabaseBackend(householdId: string): Backend {
  const db = supabase!;
  const check = <T>(res: { data: T; error: unknown }) => {
    if (res.error) throw res.error;
    return res.data;
  };

  return {
    kind: "supabase",

    async load() {
      const [household, members, meals, ingredients, mealIngredients, cookLog, shop, ideaVotes] = await Promise.all([
        db.from("households").select("*").eq("id", householdId).single().then(check),
        db.from("members").select("user_id, household_id, display_name").eq("household_id", householdId).then(check),
        db.from("meals").select("*").eq("household_id", householdId).then(check),
        db.from("ingredients").select("*").eq("household_id", householdId).then(check),
        db.from("meal_ingredients").select("meal_id, ingredient_id, meals!inner(household_id)").eq("meals.household_id", householdId).then(check),
        db.from("cook_log").select("*").eq("household_id", householdId).order("cooked_on", { ascending: false }).then(check),
        db.from("shopping_items").select("*").eq("household_id", householdId).order("created_at").then(check),
        db.from("idea_votes").select("*").eq("household_id", householdId).then(check),
      ]);

      const photoUrls: Record<string, string> = {};
      const paths = (meals as { id: string; photo_path: string | null }[]).filter((m) => m.photo_path);
      if (paths.length) {
        const { data } = await db.storage.from(PHOTO_BUCKET).createSignedUrls(paths.map((m) => m.photo_path!), 60 * 60 * 24);
        data?.forEach((d, i) => {
          if (d.signedUrl) photoUrls[paths[i].id] = d.signedUrl;
        });
      }

      return {
        household,
        members,
        meals,
        ingredients,
        mealIngredients: (mealIngredients as { meal_id: string; ingredient_id: string }[]).map(({ meal_id, ingredient_id }) => ({ meal_id, ingredient_id })),
        cookLog,
        shop,
        ideaVotes,
        photoUrls,
      } as Snapshot;
    },

    async insert(table, rows) {
      if (!rows.length) return;
      check(await db.from(table).insert(rows));
    },

    async update(table, id, patch) {
      check(await db.from(table).update(patch).eq("id", id));
    },

    async remove(table, ids) {
      if (!ids.length) return;
      check(await db.from(table).delete().in("id", ids));
    },

    async setMealIngredients(mealId, ingredientIds) {
      check(await db.from("meal_ingredients").delete().eq("meal_id", mealId));
      if (ingredientIds.length) {
        check(await db.from("meal_ingredients").insert(ingredientIds.map((ingredient_id) => ({ meal_id: mealId, ingredient_id }))));
      }
    },

    subscribe(onChange, onStale) {
      const filter = `household_id=eq.${householdId}`;
      const handle = (table: Table) => (p: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
        if (p.eventType === "DELETE") onChange({ type: "delete", table, ids: [p.old.id as string] });
        else onChange({ type: "upsert", table, rows: [p.new as Row] });
      };
      const channel: RealtimeChannel = db
        .channel(`household:${householdId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "shopping_items", filter }, handle("shopping_items"))
        .on("postgres_changes", { event: "*", schema: "public", table: "ingredients", filter }, handle("ingredients"))
        .on("postgres_changes", { event: "*", schema: "public", table: "cook_log", filter }, handle("cook_log"))
        .subscribe((status) => {
          if (status === "SUBSCRIBED") onStale();
        });

      const onVisible = () => {
        if (document.visibilityState === "visible") onStale();
      };
      document.addEventListener("visibilitychange", onVisible);
      return () => {
        document.removeEventListener("visibilitychange", onVisible);
        db.removeChannel(channel);
      };
    },
  };
}
