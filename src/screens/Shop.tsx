import { useRef, useState } from "react";
import { useToast } from "../components/Toast";
import { Stitch } from "../plate/Plate";
import { cap, tidy } from "../lib/format";
import { pageIntro, useGSAP, withMotion } from "../lib/motion";
import { useStore } from "../lib/store";
import { ShareIcon } from "../components/ShareIcon";
import { useShareShop } from "./useShare";

export function Shop() {
  const store = useStore();
  const toast = useToast();
  const root = useRef<HTMLElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const share = useShareShop();
  useGSAP(() => withMotion(() => pageIntro(root.current!)), { scope: root });

  const items = store.snap.shop.slice().sort((a, b) => a.created_at.localeCompare(b.created_at));

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v) return;
    setDraft("");
    input.current?.focus();
    if (!(await store.addShopItem(v))) toast(`${cap(v.toLowerCase())} už v nákupu je.`);
  };

  const toggle = async (id: string, done: boolean) => {
    const ing = await store.toggleShop(id, done);
    if (ing && ing.tracked) toast(`${cap(ing.name)} je zpátky ve spíži.`);
  };

  return (
    <section ref={root}>
      <header className="page-head">
        <div className="page-head-row">
          <h1 className="title">Nákup</h1>
          {store.openShop.length > 0 && (
            <button className="btn ghost" onClick={share}>
              <ShareIcon />
              Poslat seznam
            </button>
          )}
        </div>
        <p className="sub">Co odškrtneš, vrátí se do spíže.</p>
      </header>
      <Stitch />
      <form className="shop-add" onSubmit={add}>
        <input ref={input} className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Přidat položku" autoComplete="off" aria-label="Přidat položku do nákupu" enterKeyHint="done" />
        <button className="btn primary" type="submit">
          Přidat
        </button>
      </form>
      <ul className="shop-list">
        {items.length ? (
          items.map((it) => {
            const meal = it.for_meal_id ? store.mealById(it.for_meal_id) : undefined;
            return (
              <li key={it.id} className="shop-item">
                <label>
                  <input className="check" type="checkbox" checked={it.done} onChange={(e) => toggle(it.id, e.target.checked)} />
                  <span className="shop-name">{it.name}</span>
                  {meal && <small className="shop-for">{tidy(meal.name)}</small>}
                </label>
              </li>
            );
          })
        ) : (
          <li className="shop-empty">Nákup je prázdný. Přidej položku, nebo si vyber jídlo a chybějící suroviny se doplní samy.</li>
        )}
      </ul>
      {items.some((x) => x.done) && (
        <button className="link clear-done" onClick={() => store.clearDone()}>
          Smazat koupené
        </button>
      )}
    </section>
  );
}
