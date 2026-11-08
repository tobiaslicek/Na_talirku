import { useSheets } from "../components/sheets";
import { useToast } from "../components/Toast";
import type { Idea } from "../data/ideas";
import { isoDate } from "../lib/format";
import { useStore } from "../lib/store";
import { cookMessage } from "./useCook";

export function useIdeaActions() {
  const store = useStore();
  const toast = useToast();
  const { close } = useSheets();
  return {
    async cookIdea(idea: Idea, day = isoDate(new Date())) {
      close();
      const own = store.adoptedMeal(idea);
      if (own) {
        toast(cookMessage(day, own.name, await store.cook(own.id, day)));
        return;
      }
      const { added } = await store.adoptIdea(idea, day);
      toast(cookMessage(day, idea.name, added, true));
    },
  };
}
