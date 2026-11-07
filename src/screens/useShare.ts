import { useToast } from "../components/Toast";
import { list, minutes } from "../lib/format";
import { linkTo } from "../lib/route";
import { SHARE_TOAST, shareText } from "../lib/share";
import { useStore } from "../lib/store";

export function useShareMeal() {
  const store = useStore();
  const toast = useToast();
  return async (mealId: string) => {
    const meal = store.mealById(mealId);
    if (!meal) return;
    const miss = store.missingOf(mealId).map((i) => i.name);
    const need = miss.length ? `Dokoupit: ${list(miss)}.` : "Všechno máme doma.";
    const res = await shareText(meal.name, `Co takhle dnes ${meal.name}? ${minutes(meal.minutes)}. ${need}`, linkTo("jidla", mealId));
    const msg = SHARE_TOAST[res];
    if (msg) toast(msg);
  };
}

export function useShareShop() {
  const store = useStore();
  const toast = useToast();
  return async () => {
    const open = store.openShop;
    if (!open.length) return toast("Nákup je prázdný.");
    const text = `Nákup:\n${open.map((x) => `☐ ${x.name}`).join("\n")}\n\nOdškrtávat jde tady:`;
    const msg = SHARE_TOAST[await shareText("Nákup", text, linkTo("nakup"))];
    if (msg) toast(msg);
  };
}
