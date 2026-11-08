import { useSheets } from "../components/sheets";
import { useToast } from "../components/Toast";
import type { Idea } from "../data/ideas";
import { list } from "../lib/format";
import { useStore } from "../lib/store";

export function useIdeaActions() {
  const store = useStore();
  const toast = useToast();
  const { close, openMeal } = useSheets();
  return {
    async cookIdea(idea: Idea) {
      close();
      const { added } = await store.adoptIdea(idea, true);
      toast(added.length ? `Dobrou chuť. Jídlo je mezi vašimi a do nákupu přibylo: ${list(added)}.` : "Dobrou chuť. Jídlo je mezi vašimi a všechno máte doma.");
    },
    async keepIdea(idea: Idea) {
      const { mealId } = await store.adoptIdea(idea, false);
      toast("Jídlo je mezi vašimi.");
      openMeal(mealId);
    },
  };
}
