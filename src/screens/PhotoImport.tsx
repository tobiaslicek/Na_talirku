import { useEffect, useRef, useState } from "react";
import { useSheets } from "../components/sheets";
import { useToast } from "../components/Toast";
import { plural } from "../lib/format";
import { ZONE_LABEL } from "../lib/labels";
import { parsePhotos } from "../lib/photos";
import { useStore } from "../lib/store";
import { ZONES, type Zone } from "../lib/types";

interface Row {
  key: string;
  raw: string;
  name: string;
  zone: Zone;
  on: boolean;
}

const newRow = (r: Partial<Row> = {}): Row => ({ key: crypto.randomUUID(), raw: "", name: "", zone: "lednice", on: true, ...r });

export function PhotoImport({ files }: { files: File[] }) {
  const store = useStore();
  const toast = useToast();
  const { close } = useSheets();
  const [phase, setPhase] = useState<"reading" | "review">("reading");
  const [local, setLocal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const known = store.snap.ingredients.map((i) => ({ name: i.name, zone: i.zone }));
    parsePhotos(files, known, () => setLocal(true), setProgress)
      .then(({ items, local }) => {
        setRows(
          items.map((it) => {
            const existing = store.findIngredient(it.name);
            return newRow({ raw: it.raw, name: existing?.name ?? it.name.toLowerCase(), zone: existing?.tracked ? existing.zone : it.zone });
          }),
        );
        if (!items.length) setNote(local ? "Na fotce jsem nenašel čitelnou účtenku. Zdarma umím přečíst jen účtenky, potraviny v lednici ne. Položky můžeš dopsat ručně." : "Na fotkách nevidím žádné potraviny. Můžeš je dopsat ručně.");
        else if (local) setNote("Názvy z účtenky jsou zkrácené, tak je zkontroluj. Co nechceš, odškrtni.");
      })
      .catch((e) => {
        console.error(e);
        setRows([newRow()]);
        setNote(navigator.onLine ? "Fotky se nepodařilo přečíst. Zkus to znovu, nebo položky dopiš ručně." : "Poprvé potřebuje čtení účtenek internet. Zkus to znovu, až budeš online, nebo položky dopiš ručně.");
      })
      .finally(() => setPhase("review"));
  }, [files, store]);

  const patch = (key: string, p: Partial<Row>) => setRows((cur) => cur.map((r) => (r.key === key ? { ...r, ...p } : r)));
  const chosen = rows.filter((r) => r.on && r.name.trim());

  const save = async () => {
    setBusy(true);
    const res = await store.stockPantry(chosen.map((r) => ({ name: r.name, zone: r.zone })));
    setBusy(false);
    close();
    const n = res.added + res.restocked;
    const bought = res.bought ? ` Z nákupu odškrtnuto: ${res.bought}.` : "";
    toast(`Uloženo do spíže: ${n} ${plural(n, "položka", "položky", "položek")}.${bought}`);
  };

  if (phase === "reading") {
    return (
      <div className="reading" aria-busy="true">
        <h2 className="sheet-title" id="sheet-title">
          Čtu {files.length === 1 ? "fotku" : "fotky"}
        </h2>
        <p className="meta">
          {local
            ? `Čtu účtenku přímo v telefonu, nikam ji neposílám. Poprvé to trvá déle.${progress > 0 ? ` Hotovo ${Math.round(progress * 100)}\u00a0%.` : ""}`
            : `Chvilku to trvá, sepisuju, co na ${files.length === 1 ? "ní" : "nich"} je.`}
        </p>
        <div className="reading-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="sheet-title" id="sheet-title">
        Co ukládáme do spíže
      </h2>
      <p className="meta">{note || "Zkontroluj názvy a místo. Co nechceš, odškrtni."}</p>
      <ul className="import-list">
        {rows.map((r) => {
          const existing = r.name.trim() ? store.findIngredient(r.name) : undefined;
          return (
            <li key={r.key} className={r.on ? "import-row" : "import-row off"}>
              <input className="check" type="checkbox" checked={r.on} onChange={(e) => patch(r.key, { on: e.target.checked })} aria-label={`Uložit ${r.name || "položku"}`} />
              <div className="import-main">
                <input className="input sm" value={r.name} onChange={(e) => patch(r.key, { name: e.target.value })} placeholder="Název" aria-label="Název položky" autoComplete="off" />
                <div className="import-meta">
                  <select className="select" value={r.zone} onChange={(e) => patch(r.key, { zone: e.target.value as Zone })} aria-label="Kam to patří">
                    {ZONES.map((z) => (
                      <option key={z} value={z}>
                        {ZONE_LABEL[z]}
                      </option>
                    ))}
                  </select>
                  <span className="import-hint">{existing?.tracked ? "už sledujeme" : r.name.trim() ? "nová položka" : ""}</span>
                </div>
                {r.raw && <span className="r-raw">{r.raw}</span>}
              </div>
              <button type="button" className="ing-remove" aria-label={`Smazat ${r.name || "položku"}`} onClick={() => setRows((cur) => cur.filter((x) => x.key !== r.key))}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="link" onClick={() => setRows((cur) => [...cur, newRow()])}>
        Přidat další položku
      </button>
      <div className="sheet-actions">
        <button className="btn primary" onClick={save} disabled={busy || !chosen.length}>
          Uložit do spíže{chosen.length ? ` (${chosen.length})` : ""}
        </button>
      </div>
    </div>
  );
}
