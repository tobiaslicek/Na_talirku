import type { IngredientState, Zone } from "./types";
import { fold, zoneFor, type KnownIngredient } from "./receipt";

export interface SaidItem {
  name: string;
  state: IngredientState;
  zone: Zone;
  known: boolean;
}

const STATE_WORDS: Record<string, IngredientState> = {
  mame: "mame", mam: "mame", koupili: "mame", koupil: "mame", koupila: "mame", koupeno: "mame", nakoupili: "mame", dokoupili: "mame", doplnili: "mame",
  dochazi: "dochazi", dochazeji: "dochazi", malo: "dochazi", dojde: "dochazi", dojdou: "dochazi",
  nemame: "doslo", nemam: "doslo", doslo: "doslo", dosel: "doslo", dosla: "doslo", dosly: "doslo", dosli: "doslo", chybi: "doslo", neni: "doslo",
  nejsou: "doslo", vypotrebovali: "doslo", snedli: "doslo", dojedli: "doslo",
};
const ALMOST = new Set(["skoro", "temer", "brzo", "brzy"]);

const ZONE_WORDS: [string, Zone][] = [["lednic", "lednice"], ["lednick", "lednice"], ["mrazak", "mrazak"], ["mrazni", "mrazak"], ["spiz", "spiz"], ["spajz", "spiz"], ["skrin", "spiz"]];

const SEPARATORS = new Set(["a", "i", "ani", "nebo", "plus", "taky", "take"]);
const FILLER = new Set([
  "uz", "jeste", "jen", "jenom", "trochu", "hodne", "par", "nejake", "nejakou", "nejaky", "nejaka", "nejakych", "doma", "tu", "tam", "porad", "stale",
  "asi", "mozna", "baleni", "kus", "kusy", "kusu", "kila", "kilo", "kg", "dkg", "litr", "litry", "pul", "pulku", "pulka", "zbytek", "zbytky", "jedno",
  "jedna", "jeden", "dva", "dve", "tri", "v", "ve", "do", "na", "z", "ze", "s", "se", "je", "jsou", "jsme", "ted", "vic", "dost", "plno", "spousta",
  "celkem", "vsechno", "vse", "co", "to", "ty", "ta", "ten", "nam", "mi", "my", "ok", "jo", "ano", "ne", "tak", "pak", "potom", "a", "ani",
]);

const ALIASES: [string, string][] = [["sojovk", "sójová omáčka"], ["sojovou omack", "sójová omáčka"], ["vajick", "vejce"], ["vajic", "vejce"], ["mlik", "mléko"]];

const ADJ_END = /(ych|ymi|ym|eho|emu|ou|ich|imi|im)$/;
const stem = (w: string) => (w.length < 4 ? w : w.replace(ADJ_END, "").replace(/[aeiouy]+$/, "") || w);
const letters = (w: string) => fold(w).replace(/[^a-z]/g, "");

function matches(item: string[], k: string[]) {
  const used = new Set<number>();
  return k.every((kw) => {
    const i = item.findIndex((w, j) => !used.has(j) && (w === kw || (w.length >= 5 && kw.length >= 5 && w.slice(0, 5) === kw.slice(0, 5) && Math.abs(w.length - kw.length) <= 2)));
    if (i < 0) return false;
    used.add(i);
    return true;
  });
}

function findKnown(words: string[], known: KnownIngredient[]) {
  const item = words.map((w) => stem(letters(w)));
  let best: KnownIngredient | null = null;
  let bestScore = 0;
  for (const k of known) {
    const kw = k.name.split(/\s+/).map((w) => stem(letters(w))).filter(Boolean);
    if (kw.length !== item.length || !matches(item, kw)) continue;
    const score = k.name.length;
    if (score > bestScore) {
      best = k;
      bestScore = score;
    }
  }
  return best;
}

function nominative(words: string[]) {
  return words
    .map((w, i) => {
      const last = i === words.length - 1;
      if (!last) return w.replace(/ou$/, "á");
      if (w.length < 4) return w;
      if (/[cčlžřjň]i$/.test(w)) return w.slice(0, -1) + "e";
      if (/[^aeiouyáéíóúůý]u$/.test(w)) return w.slice(0, -1) + "a";
      return w;
    })
    .join(" ");
}

function resolve(words: string[], known: KnownIngredient[]): { name: string; known: KnownIngredient | null } | null {
  if (!words.length) return null;
  const joined = words.map(letters).join(" ");
  const alias = ALIASES.find(([a]) => joined.startsWith(a));
  if (alias) {
    const k = known.find((x) => fold(x.name) === fold(alias[1]));
    return { name: k?.name ?? alias[1], known: k ?? null };
  }
  const k = findKnown(words, known);
  if (k) return { name: k.name, known: k };
  const name = nominative(words.map((w) => w.toLowerCase()));
  return name.replace(/\s/g, "").length >= 3 ? { name, known: null } : null;
}

type Token = { kind: "kw"; state: IngredientState } | { kind: "item"; words: string[]; zone: Zone | null; state?: IngredientState };

export function parsePantryText(text: string, known: KnownIngredient[]): SaidItem[] {
  const out = new Map<string, SaidItem>();
  let state: IngredientState = "mame";
  let zone: Zone | null = null;

  for (const chunk of text.split(/[,;.!?:\n]+/)) {
    const tokens: Token[] = [];
    let cur: string[] = [];
    let almost = false;
    const flush = () => {
      if (cur.length) tokens.push({ kind: "item", words: cur, zone });
      cur = [];
    };
    for (const w of chunk.split(/\s+/)) {
      const f = letters(w);
      if (!f) continue;
      const kw = STATE_WORDS[f];
      if (kw) {
        flush();
        tokens.push({ kind: "kw", state: almost && kw === "doslo" ? "dochazi" : kw });
        almost = false;
      } else if (ALMOST.has(f)) {
        almost = true;
      } else if (ZONE_WORDS.some(([p]) => f.startsWith(p))) {
        flush();
        zone = ZONE_WORDS.find(([p]) => f.startsWith(p))![1];
      } else if (SEPARATORS.has(f)) {
        flush();
      } else if (!FILLER.has(f) && !/^\d/.test(w)) {
        cur.push(w.replace(/[^\p{L}-]/gu, ""));
      }
    }
    flush();

    // Klíčové slovo platí pro položky za ním; když za ním nic není („mléko došlo“), platí pro tu před ním.
    let led = false;
    tokens.forEach((t, i) => {
      if (t.kind === "item") {
        t.state = state;
        return;
      }
      const next = tokens[i + 1];
      if (next && next.kind === "item") {
        state = t.state;
        led = true;
        return;
      }
      const prev: Token[] = [];
      for (let j = i - 1; j >= 0 && tokens[j].kind === "item"; j--) prev.unshift(tokens[j]);
      for (const p of led ? prev.slice(-1) : prev) if (p.kind === "item") p.state = t.state;
      if (!led) state = t.state;
    });

    for (const t of tokens) {
      if (t.kind !== "item") continue;
      const r = resolve(t.words, known);
      if (!r) continue;
      const key = fold(r.name);
      out.delete(key);
      out.set(key, { name: r.name, state: t.state ?? state, zone: r.known?.zone ?? t.zone ?? zoneFor(r.name), known: !!r.known });
    }
  }
  return [...out.values()];
}
