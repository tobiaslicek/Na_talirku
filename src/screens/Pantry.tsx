import { useRef } from "react";
import { Stitch } from "../plate/Plate";
import { cap, plural } from "../lib/format";
import { STATE_LABEL, ZONE_LABEL } from "../lib/labels";
import { pageIntro, useGSAP, withMotion } from "../lib/motion";
import { useStore } from "../lib/store";
import { ZONES } from "../lib/types";

export function Pantry() {
  const store = useStore();
  const root = useRef<HTMLElement>(null);
  useGSAP(() => withMotion(() => pageIntro(root.current!)), { scope: root });

  return (
    <section ref={root}>
      <header className="page-head">
        <h1 className="title">Co máme doma</h1>
        <p className="sub">Klepnutím přepneš stav: máme, dochází, došlo.</p>
      </header>
      <Stitch />
      {ZONES.map((z) => {
        const items = store.snap.ingredients.filter((i) => i.tracked && i.zone === z).sort((a, b) => a.name.localeCompare(b.name, "cs"));
        const low = items.filter((i) => i.state === "dochazi").length;
        return (
          <section className="zone" key={z}>
            <div className="zone-head">
              <h2>{ZONE_LABEL[z]}</h2>
              <span className="zone-count">
                {items.length} {plural(items.length, "položka", "položky", "položek")}
                {low ? `, ${low} dochází` : ""}
              </span>
            </div>
            {items.length ? (
              <div className="items">
                {items.map((i) => (
                  <button key={i.id} className="item" data-s={i.state} aria-label={`${cap(i.name)}, ${STATE_LABEL[i.state]}`} onClick={() => store.cycleIngredient(i.id)}>
                    <span className="dot" />
                    <span className="label">{i.name}</span>
                    {i.state === "dochazi" && <span className="tag">dochází</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="quiet">Tady zatím nic nesledujeme.</p>
            )}
          </section>
        );
      })}
    </section>
  );
}
