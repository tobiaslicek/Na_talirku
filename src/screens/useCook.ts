import { useSheets } from "../components/sheets";
import { useToast } from "../components/Toast";
import { isToday } from "../components/day";
import { cap, forDay, isoDate, list, tidy } from "../lib/format";
import { useStore } from "../lib/store";

export function cookMessage(day: string, name: string, added: string[], adopted = false) {
  const kept = adopted ? " Jídlo je mezi vašimi." : "";
  const buy = added.length ? `Do nákupu přibylo: ${list(added)}.` : "Všechno máte doma.";
  if (isToday(day)) return `Dobrou chuť.${kept} ${buy}`;
  return `${cap(forDay(day))} je v plánu ${tidy(name)}.${kept} ${buy}`;
}

export function useCookAction() {
  const store = useStore();
  const toast = useToast();
  const { close } = useSheets();
  return async (mealId: string, day = isoDate(new Date())) => {
    close();
    const name = store.mealById(mealId)?.name ?? "";
    const added = await store.cook(mealId, day);
    toast(cookMessage(day, name, added));
  };
}
