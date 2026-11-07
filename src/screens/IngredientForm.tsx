import { useState } from "react";
import { Chips } from "../components/Chips";
import { useSheets } from "../components/sheets";
import { useToast } from "../components/Toast";
import { list } from "../lib/format";
import { STATE_LABEL, ZONE_LABEL } from "../lib/labels";
import { useStore } from "../lib/store";
import { ZONES, type IngredientState, type Zone } from "../lib/types";

const STATES: IngredientState[] = ["mame", "dochazi", "doslo"];

export function IngredientForm({ id }: { id?: string }) {
  const store = useStore();
  const toast = useToast();
  const { close } = useSheets();
  const ing = id ? store.snap.ingredients.find((i) => i.id === id) : undefined;
  const [name, setName] = useState(ing?.name ?? "");
  const [zone, setZone] = useState<Zone>(ing?.zone ?? "lednice");
  const [state, setState] = useState<IngredientState>(ing?.state ?? "mame");
  const [error, setError] = useState("");
  const usedIn = id ? store.mealsUsing(id) : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Položka potřebuje název.");
    const ok = id ? await store.updateIngredient(id, { name, zone, state }) : await store.addIngredient({ name, zone, state });
    if (!ok) return setError(`„${name.trim()}“ už ve spíži máme.`);
    toast(id ? "Položka je upravená." : "Položka je ve spíži.");
    close();
  };

  const remove = async () => {
    if (!id) return;
    close();
    await store.removeIngredient(id);
    toast("Položka je pryč ze spíže.");
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <h2 className="sheet-title" id="sheet-title">
        {id ? "Upravit položku" : "Přidat do spíže"}
      </h2>
      <label className="field">
        <span className="form-label">Název</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Třeba jogurt" autoComplete="off" enterKeyHint="done" />
      </label>
      <div className="field">
        <span className="form-label" id="l-zone">
          Kde to je
        </span>
        <Chips className="wrap" options={ZONES.map((z) => [z, ZONE_LABEL[z]] as [Zone, string])} value={zone} labelledBy="l-zone" onChange={setZone} />
      </div>
      <div className="field">
        <span className="form-label" id="l-state">
          Stav
        </span>
        <Chips className="wrap" options={STATES.map((s) => [s, STATE_LABEL[s]] as [IngredientState, string])} value={state} labelledBy="l-state" onChange={setState} />
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="sheet-actions">
        <button className="btn primary" type="submit">
          {id ? "Uložit" : "Přidat"}
        </button>
      </div>
      {id && (
        <div className="sheet-foot column">
          <button type="button" className="link danger" onClick={remove}>
            Odebrat ze spíže
          </button>
          {usedIn.length > 0 && <p className="hint">V jídlech zůstane: {list(usedIn.map((m) => m.name))}.</p>}
        </div>
      )}
    </form>
  );
}
