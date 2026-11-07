import { useSheets } from "../components/sheets";
import { useToast } from "../components/Toast";
import { list } from "../lib/format";
import { useStore } from "../lib/store";

export function useCookAction() {
  const store = useStore();
  const toast = useToast();
  const { close } = useSheets();
  return async (mealId: string) => {
    close();
    const added = await store.cook(mealId);
    toast(added.length ? `Dobrou chuť. Do nákupu přibylo: ${list(added)}.` : "Dobrou chuť. Všechno máte doma.");
  };
}
