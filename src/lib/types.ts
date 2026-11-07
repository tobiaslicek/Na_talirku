export type Tag = "rychle" | "vikend" | "bezmasa" | "maso" | "polevka" | "sladke";
export type Zone = "lednice" | "mrazak" | "spiz";
export type IngredientState = "mame" | "dochazi" | "doslo";

export const TAGS: Tag[] = ["rychle", "vikend", "bezmasa", "maso", "polevka", "sladke"];
export const ZONES: Zone[] = ["lednice", "mrazak", "spiz"];

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface Member {
  user_id: string;
  household_id: string;
  display_name: string;
}

export interface Meal {
  id: string;
  household_id: string;
  name: string;
  minutes: number;
  tags: Tag[];
  photo_path: string | null;
  created_at: string;
}

export interface Ingredient {
  id: string;
  household_id: string;
  name: string;
  zone: Zone;
  state: IngredientState;
  tracked: boolean;
}

export interface MealIngredient {
  meal_id: string;
  ingredient_id: string;
}

export interface CookLog {
  id: string;
  household_id: string;
  meal_id: string;
  cooked_on: string;
  cooked_by: string | null;
}

export interface ShoppingItem {
  id: string;
  household_id: string;
  name: string;
  ingredient_id: string | null;
  for_meal_id: string | null;
  done: boolean;
  done_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Snapshot {
  household: Household;
  members: Member[];
  meals: Meal[];
  ingredients: Ingredient[];
  mealIngredients: MealIngredient[];
  cookLog: CookLog[];
  shop: ShoppingItem[];
  photoUrls: Record<string, string>;
}
