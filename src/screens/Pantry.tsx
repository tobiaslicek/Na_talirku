import { useRef, useState } from "react";
import { useSheets } from "../components/sheets";
import { Stitch } from "../plate/Plate";
import { cap, plural } from "../lib/format";
import { STATE_LABEL, ZONE_LABEL } from "../lib/labels";
import { pageIntro, useGSAP, withMotion } from "../lib/motion";
import { useStore } from "../lib/store";
import { ZONES } from "../lib/types";

export function Pantry() {
  const store = useStore();
  const { openIngredient, openImport } = useSheets();
  const root = useRef<HTMLElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  useGSAP(() => withMotion(() => pageIntro(root.current!)), { scope: root });

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length) openImport(files.slice(0, 6));
  };

  return (
    <section ref={root}>
      <header className="page-head">
        <div className="page-head-row">
          <h1 className="title">Ve spíži</h1>
          <button className="link" onClick={() => setEditing((v) => !v)} aria-pressed={editing}>
            {editing ? "Hotovo" : "Upravit"}
          </button>
        </div>
        <p className="sub">{editing ? "Klepni na položku, kterou chceš přejmenovat, přesunout nebo odebrat." : "Klepnutím přepneš stav: máme, dochází, došlo."}</p>
      </header>
      <Stitch />
      <div className="pantry-actions">
        <button className="receipt" onClick={() => fileInput.current?.click()}>
          <span className="ico-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.4-2h5l1.4 2h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" />
              <circle cx="12" cy="12.4" r="3.4" />
            </svg>
          </span>
          <span>
            <span className="receipt-t">Vyfotit účtenku</span>
            <span className="receipt-s">{"Položky z\u00a0ní sepíšu do spíže a\u00a0před uložením je upravíš."}</span>
          </span>
        </button>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={onFiles} />
        <button className="btn ghost" onClick={() => openIngredient()}>
          Přidat ručně
        </button>
      </div>
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
              <div className={editing ? "items editing" : "items"}>
                {items.map((i) => (
                  <button
                    key={i.id}
                    className="item"
                    data-s={i.state}
                    aria-label={editing ? `Upravit ${i.name}` : `${cap(i.name)}, ${STATE_LABEL[i.state]}`}
                    onClick={() => (editing ? openIngredient(i.id) : store.cycleIngredient(i.id))}
                  >
                    <span className="dot" />
                    <span className="label">{i.name}</span>
                    {i.state === "dochazi" && <span className="tag">dochází</span>}
                    {editing && (
                      <svg className="pen" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10.5 2.5l3 3L5.5 13.5H2.5v-3z" />
                      </svg>
                    )}
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
