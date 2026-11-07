import { useRef } from "react";
import { useSheets } from "../components/sheets";
import { useToast } from "../components/Toast";
import { Plate } from "../plate/Plate";
import { ago, cap, list, longDate, minutes, tidy } from "../lib/format";
import { STATE_LABEL, TAG_LABEL } from "../lib/labels";
import { gsap, useGSAP, withMotion } from "../lib/motion";
import { useStore } from "../lib/store";
import { useCookAction } from "./useCook";
import { ShareIcon } from "../components/ShareIcon";
import { useShareMeal } from "./useShare";

export function MealDetail({ id }: { id: string }) {
  const store = useStore();
  const toast = useToast();
  const { close, openEdit } = useSheets();
  const cook = useCookAction();
  const share = useShareMeal();
  const root = useRef<HTMLDivElement>(null);
  const meal = store.mealById(id);

  useGSAP(() => withMotion(() => gsap.from(".dish.big .plate", { rotation: -140, duration: 1.1, ease: "expo.out", delay: 0.04 })), { scope: root, dependencies: [id] });

  if (!meal) return <p className="quiet">Tohle jídlo už v katalogu není.</p>;
  const ings = store.ingredientsOf(id).slice().sort((a, b) => a.name.localeCompare(b.name, "cs"));
  const miss = store.missingOf(id);
  const history = store.historyOf(id).slice(0, 5);

  const buy = async () => {
    const added = await store.addMissingToShop(id);
    close();
    toast(added.length ? `Do nákupu přibylo: ${list(added)}.` : "Všechno už v nákupu je.");
  };

  return (
    <div ref={root}>
      <Plate meal={meal} photoUrl={store.snap.photoUrls[id]} size="big" />
      <h2 className="sheet-title" id="sheet-title">
        {tidy(meal.name)}
      </h2>
      <p className="meta">
        {minutes(meal.minutes)}, naposled {ago(store.daysSinceCooked(id))}
      </p>
      {meal.tags.length > 0 && (
        <div className="tags">
          {meal.tags.map((t) => (
            <span key={t} className="tag-pill">
              {TAG_LABEL[t]}
            </span>
          ))}
        </div>
      )}
      {ings.length > 0 ? (
        <ul className="ing">
          {ings.map((i) => (
            <li key={i.id} data-s={i.state}>
              <span className="dot" />
              {cap(i.name)}
              <span className="st">{i.state === "doslo" ? "nemáme" : STATE_LABEL[i.state]}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta" style={{ marginTop: 20 }}>
          Zatím bez surovin.
        </p>
      )}
      <div className="sheet-actions">
        <button className="btn primary" onClick={() => cook(id)}>
          Tohle uvaříme
        </button>
        {miss.length > 0 && (
          <button className="btn ghost" onClick={buy}>
            Přidat chybějící do nákupu
          </button>
        )}
        <button className="btn ghost" onClick={() => share(id)}>
          <ShareIcon />
          Poslat ve zprávě
        </button>
      </div>
      {history.length > 0 && (
        <div className="history">
          <h3>Kdy jsme vařili</h3>
          <ul>
            {history.map((c) => (
              <li key={c.id}>
                <span>{longDate(c.cooked_on)}</span>
                <button className="link danger" onClick={() => store.deleteCook(c.id)} aria-label={`Smazat záznam z ${longDate(c.cooked_on)}`}>
                  smazat
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="sheet-foot">
        <button className="link" onClick={() => openEdit(id)}>
          Upravit jídlo
        </button>
      </div>
    </div>
  );
}
