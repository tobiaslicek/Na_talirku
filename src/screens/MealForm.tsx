import { useMemo, useState } from "react";
import { useSheets } from "../components/sheets";
import { useToast } from "../components/Toast";
import { Chips } from "../components/Chips";
import { TAG_LABEL } from "../lib/labels";
import { useStore } from "../lib/store";
import { TAGS, type Tag } from "../lib/types";

export function MealForm({ id }: { id?: string }) {
  const store = useStore();
  const toast = useToast();
  const { close, openMeal } = useSheets();
  const meal = id ? store.mealById(id) : undefined;
  const [name, setName] = useState(meal?.name ?? "");
  const [mins, setMins] = useState(String(meal?.minutes ?? 30));
  const [tags, setTags] = useState<Tag[]>(meal?.tags ?? []);
  const [recipe, setRecipe] = useState(meal?.recipe ?? "");
  const [ings, setIngs] = useState<string[]>(() => (id ? store.ingredientsOf(id).map((i) => i.name) : []));
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const known = useMemo(() => store.snap.ingredients.map((i) => i.name).sort((a, b) => a.localeCompare(b, "cs")), [store.snap.ingredients]);

  const addDraft = () => {
    const parts = draft.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!parts.length) return;
    setIngs((cur) => [...cur, ...parts.filter((p) => !cur.includes(p))]);
    setDraft("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(mins, 10);
    if (!name.trim()) return setError("Jídlo potřebuje název.");
    if (!minutes || minutes < 1) return setError("Zadej, kolik minut příprava zabere.");
    const pending = draft.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const saved = await store.saveMeal({ id, name, minutes, tags, recipe, ingredientNames: [...ings, ...pending] });
    toast(id ? "Jídlo je upravené." : "Jídlo je v katalogu.");
    openMeal(saved);
  };

  const remove = async () => {
    if (!id || !confirm(`Opravdu smazat „${meal?.name}“? Smaže se i historie vaření.`)) return;
    close();
    await store.deleteMeal(id);
    toast("Jídlo je smazané.");
  };

  const toggleTag = (t: Tag) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  return (
    <form className="form" onSubmit={submit} noValidate>
      <h2 className="sheet-title" id="sheet-title">
        {id ? "Upravit jídlo" : "Nové jídlo"}
      </h2>
      <div className="row-2">
        <label className="field">
          <span className="form-label">Název</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Třeba Bramboráky" autoComplete="off" enterKeyHint="next" />
        </label>
        <label className="field">
          <span className="form-label">Minut</span>
          <input className="input" value={mins} onChange={(e) => setMins(e.target.value.replace(/\D/g, ""))} inputMode="numeric" enterKeyHint="next" />
        </label>
      </div>
      <div className="field">
        <span className="form-label" id="l-tags">
          Štítky
        </span>
        <Chips className="wrap" options={TAGS.map((t) => [t, TAG_LABEL[t]] as [Tag, string])} value={tags} labelledBy="l-tags" onChange={toggleTag} />
      </div>
      <div className="field">
        <label className="form-label" htmlFor="ing-input">
          Suroviny
        </label>
        {ings.length > 0 && (
          <div className="ing-edit">
            {ings.map((n) => (
              <span key={n} className="item static">
                <span className="label">{n}</span>
                <button type="button" className="ing-remove" aria-label={`Odebrat ${n}`} onClick={() => setIngs((cur) => cur.filter((x) => x !== n))}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="shop-add">
          <input
            id="ing-input"
            className="input"
            list="known-ingredients"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDraft();
              }
            }}
            placeholder="Přidat surovinu"
            autoComplete="off"
            enterKeyHint="enter"
          />
          <button type="button" className="btn ghost" onClick={addDraft}>
            Přidat
          </button>
        </div>
        <datalist id="known-ingredients">
          {known.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <p className="hint">Nové suroviny se založí ve spíži jako „máme“.</p>
      </div>
      <label className="field">
        <span className="form-label">Postup</span>
        <textarea className="input textarea" value={recipe} onChange={(e) => setRecipe(e.target.value)} placeholder="Každý krok na nový řádek. Nepovinné." rows={4} />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="sheet-actions">
        <button className="btn primary" type="submit">
          {id ? "Uložit změny" : "Přidat do katalogu"}
        </button>
      </div>
      {id && (
        <div className="sheet-foot">
          <button type="button" className="link danger" onClick={remove}>
            Smazat jídlo
          </button>
        </div>
      )}
    </form>
  );
}
