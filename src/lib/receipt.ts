import type { Zone } from "./types";
import type { ParsedItem } from "./photos";

export interface KnownIngredient {
  name: string;
  zone: Zone;
}

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

const SKIP = [
  "celkem", "soucet", "uhrad", "platb", "karta", "kartou", "hotov", "vraceno", "vratit", "dph", "zaklad", "sazba",
  "eet", "bkp", "fik", "dic", "ico", "uctenk", "pokladn", "prodejn", "dekujeme", "sleva", "zaloha", "bonus", "body",
  "terminal", "visa", "mastercard", "transakc", "autoriz", "datum", "zaokrouhl", "obal", "taska", "cislo", "danov",
  "republik", "spolec", "provozovn", "adresa", "www", "albert", "lidl", "kaufland", "billa", "tesco", "penny", "globus", "rohlik",
];

const LEDNICE = [
  "mlek", "mlik", "jogurt", "syr", "smetan", "masl", "tvaroh", "vejc", "tofu", "salat", "spenat", "avokad", "okurk", "rajc", "paprik", "citron",
  "mozzarel", "parmaz", "cedar", "eidam", "kefir", "podmasl", "feta", "hallou", "ricott", "paneer", "pesto", "porek", "brokol", "cuket", "kvetak",
  "mrkev", "klick", "koriandr", "bazalk", "mata", "limetk", "jarni", "zazvor", "gnocchi", "choi", "rukol", "celer", "zampion", "shiitak", "miso",
  "gochuj", "majonez",
];
const MRAZAK = ["mraz", "zmrz", "mrazen", "hrasek", "edamam", "falafel"];

const words = (s: string) => fold(s).split(/[^a-z]+/).filter((w) => w.length >= 3);

function close(a: string, b: string) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i >= Math.min(5, a.length, b.length);
}

function bestKnown(tokens: string[], known: KnownIngredient[]) {
  let best: { k: KnownIngredient; score: number } | null = null;
  for (const k of known) {
    const need = words(k.name);
    if (!need.length) continue;
    const used = new Set<number>();
    const ok = need.every((w) => {
      const i = tokens.findIndex((t, j) => !used.has(j) && close(t, w));
      if (i < 0) return false;
      used.add(i);
      return true;
    });
    if (!ok) continue;
    const score = need.length * 100 + k.name.length;
    if (!best || score > best.score) best = { k, score };
  }
  return best?.k ?? null;
}

export const zoneFor = (name: string) => guessZone(words(name));

function guessZone(tokens: string[]): Zone {
  if (tokens.some((t) => MRAZAK.some((m) => t.startsWith(m)))) return "mrazak";
  if (tokens.some((t) => LEDNICE.some((m) => t.startsWith(m)))) return "lednice";
  return "spiz";
}

function cleanName(line: string) {
  return line
    .replace(/-?\d+[.,]\d{2}\b/g, " ")
    .replace(/\S*\d\S*/g, " ")
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .slice(0, 3)
    .join(" ")
    .toLowerCase();
}

export function parseReceipt(text: string, known: KnownIngredient[]): ParsedItem[] {
  const out: ParsedItem[] = [];
  const seen = new Set<string>();
  for (const rawLine of text.split(/\r?\n/)) {
    const raw = rawLine.replace(/\s+/g, " ").trim();
    const letters = (raw.match(/\p{L}/gu) ?? []).length;
    if (letters < 3) continue;
    const tokens = words(raw);
    if (!tokens.length) continue;
    if (tokens.some((t) => SKIP.some((s) => (s.length <= 4 ? t === s : t.startsWith(s))))) continue;
    if (/^\d+\s*[x×*]\s*\d/.test(raw) || /\bs\.\s?r\.\s?o\b|\ba\.\s?s\./i.test(raw)) continue;

    const match = bestKnown(tokens, known);
    const name = match ? match.name : cleanName(raw);
    if (!name || name.replace(/\s/g, "").length < 3) continue;
    const key = fold(name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ raw, name, zone: match ? match.zone : guessZone(tokens) });
  }
  return out;
}
