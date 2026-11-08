import { createContext, useContext } from "react";

export type SheetState =
  | { kind: "meal"; id: string }
  | { kind: "idea"; id: string }
  | { kind: "edit"; id?: string }
  | { kind: "home" }
  | { kind: "ingredient"; id?: string }
  | { kind: "import"; files: File[] }
  | null;

export interface Sheets {
  openMeal: (id: string) => void;
  openIdea: (id: string) => void;
  openEdit: (id?: string) => void;
  openHome: () => void;
  openIngredient: (id?: string) => void;
  openImport: (files: File[]) => void;
  close: () => void;
}

const noop = () => {};
export const SheetsCtx = createContext<Sheets>({ openMeal: noop, openIdea: noop, openEdit: noop, openHome: noop, openIngredient: noop, openImport: noop, close: noop });
export const useSheets = () => useContext(SheetsCtx);
