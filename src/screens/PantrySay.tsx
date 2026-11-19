import { useEffect, useRef, useState } from "react";
import { useSheets } from "../components/sheets";
import { useToast } from "../components/Toast";
import { plural, tidy } from "../lib/format";
import { STATE_LABEL, ZONE_LABEL } from "../lib/labels";
import { parsePantryText } from "../lib/pantryText";
import { useStore } from "../lib/store";
import { ZONES, type IngredientState, type Zone } from "../lib/types";

interface Row {
  key: string;
  name: string;
  state: IngredientState;
  zone: Zone;
  on: boolean;
}

const STATES: IngredientState[] = ["mame", "dochazi", "doslo"];

interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionCtor = new () => Recognition;
const SpeechRec: RecognitionCtor | undefined =
  typeof window === "undefined" ? undefined : ((window as unknown as Record<string, RecognitionCtor | undefined>).SpeechRecognition ?? (window as unknown as Record<string, RecognitionCtor | undefined>).webkitSpeechRecognition);

export function PantrySay() {
  const store = useStore();
  const toast = useToast();
  const { close } = useSheets();
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);

  useEffect(() => () => rec.current?.stop(), []);

  const dictate = () => {
    if (!SpeechRec) return;
    if (listening) {
      rec.current?.stop();
      return;
    }
    const r = new SpeechRec();
    r.lang = "cs-CZ";
    r.interimResults = false;
    r.continuous = true;
    r.onresult = (e) => {
      let said = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) said += e.results[i][0].transcript;
      if (said.trim()) setText((t) => (t.trim() ? `${t.trim()}, ${said.trim()}` : said.trim()));
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") toast("Diktování tu nejde. Použij mikrofon na klávesnici.");
    };
    r.onend = () => setListening(false);
    rec.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      toast("Diktování tu nejde. Použij mikrofon na klávesnici.");
    }
  };

  const review = () => {
    rec.current?.stop();
    const known = store.snap.ingredients.map((i) => ({ name: i.name, zone: i.zone }));
    const items = parsePantryText(text, known);
    setRows(items.map((it) => ({ key: crypto.randomUUID(), name: it.name, state: it.state, zone: it.zone, on: true })));
  };

  if (!rows) {
    return (
      <div>
        <h2 className="sheet-title" id="sheet-title">
          Co máme doma
        </h2>
        <p className="meta">{tidy("Napiš nebo nadiktuj, co máte, co dochází a co došlo. Stačí obyčejné věty, před uložením to ještě uvidíš.")}</p>
        <textarea
          className="input textarea say-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Třeba: máme vejce, mléko a rýži, dochází máslo, nemáme papriku ani okurku. V mrazáku máme hrášek."
          rows={5}
          aria-label="Co máme doma"
          autoFocus
        />
        {SpeechRec ? (
          <button type="button" className="btn ghost say-mic" onClick={dictate} aria-pressed={listening}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
            </svg>
            {listening ? "Poslouchám, klepni pro konec" : "Nadiktovat"}
          </button>
        ) : (
          <p className="hint">{tidy("Diktovat můžeš přes mikrofon na klávesnici telefonu.")}</p>
        )}
        <div className="sheet-actions">
          <button className="btn primary" onClick={review} disabled={!text.trim()}>
            Pokračovat
          </button>
        </div>
      </div>
    );
  }

  const patch = (key: string, p: Partial<Row>) => setRows((cur) => cur!.map((r) => (r.key === key ? { ...r, ...p } : r)));
  const chosen = rows.filter((r) => r.on && r.name.trim());

  const save = async () => {
    setBusy(true);
    const res = await store.stockPantry(chosen.map((r) => ({ name: r.name, zone: r.zone, state: r.state })));
    setBusy(false);
    close();
    const n = res.added + res.restocked;
    const bought = res.bought ? ` Z nákupu odškrtnuto: ${res.bought}.` : "";
    toast(`Uloženo do spíže: ${n} ${plural(n, "položka", "položky", "položek")}.${bought}`);
  };

  return (
    <div>
      <h2 className="sheet-title" id="sheet-title">
        Co ukládáme do spíže
      </h2>
      <p className="meta">{rows.length ? "Zkontroluj názvy a stavy. Co nechceš, odškrtni." : "V textu jsem nenašel žádnou surovinu. Uprav ho, nebo položky přidej sem."}</p>
      <ul className="import-list">
        {rows.map((r) => {
          const existing = r.name.trim() ? store.findIngredient(r.name) : undefined;
          return (
            <li key={r.key} className={r.on ? "import-row" : "import-row off"}>
              <input className="check" type="checkbox" checked={r.on} onChange={(e) => patch(r.key, { on: e.target.checked })} aria-label={`Uložit ${r.name || "položku"}`} />
              <div className="import-main">
                <input className="input sm" value={r.name} onChange={(e) => patch(r.key, { name: e.target.value })} placeholder="Název" aria-label="Název položky" autoComplete="off" />
                <div className="say-states" role="radiogroup" aria-label={`Stav: ${r.name}`}>
                  {STATES.map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={r.state === s} data-s={s} className="say-state" onClick={() => patch(r.key, { state: s })}>
                      {STATE_LABEL[s]}
                    </button>
                  ))}
                </div>
                {existing?.tracked ? (
                  <span className="import-hint">už sledujeme, {ZONE_LABEL[existing.zone].toLowerCase()}</span>
                ) : (
                  <div className="import-meta">
                    <select className="select" value={r.zone} onChange={(e) => patch(r.key, { zone: e.target.value as Zone })} aria-label="Kam to patří">
                      {ZONES.map((z) => (
                        <option key={z} value={z}>
                          {ZONE_LABEL[z]}
                        </option>
                      ))}
                    </select>
                    {r.name.trim() && <span className="import-hint">nová položka</span>}
                  </div>
                )}
              </div>
              <button type="button" className="ing-remove" aria-label={`Smazat ${r.name || "položku"}`} onClick={() => setRows((cur) => cur!.filter((x) => x.key !== r.key))}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="say-links">
        <button type="button" className="link" onClick={() => setRows((cur) => [...cur!, { key: crypto.randomUUID(), name: "", state: "mame", zone: "spiz", on: true }])}>
          Přidat další položku
        </button>
        <button type="button" className="link" onClick={() => setRows(null)}>
          Upravit text
        </button>
      </div>
      <div className="sheet-actions">
        <button className="btn primary" onClick={save} disabled={busy || !chosen.length}>
          Uložit do spíže{chosen.length ? ` (${chosen.length})` : ""}
        </button>
      </div>
    </div>
  );
}
