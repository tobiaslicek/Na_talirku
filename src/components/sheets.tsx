import { createContext, useContext } from "react";

export type SheetState = { kind: "meal"; id: string } | { kind: "edit"; id?: string } | { kind: "home" } | null;

export interface Sheets {
  openMeal: (id: string) => void;
  openEdit: (id?: string) => void;
  openHome: () => void;
  close: () => void;
}

export const SheetsCtx = createContext<Sheets>({ openMeal() {}, openEdit() {}, openHome() {}, close() {} });
export const useSheets = () => useContext(SheetsCtx);
