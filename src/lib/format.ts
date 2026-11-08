export const NB = " ";
const DAY = 864e5;

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const plural = (n: number, one: string, few: string, many: string) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);

export function tidy(text: string) {
  return text.replace(/(^|[\s(„])([svkzouSVKZOU])\s+/g, `$1$2${NB}`).replace(/(\d) (?=[\p{L}°%])/gu, `$1${NB}`);
}

export function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function startOfToday(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysSince(iso: string | undefined | null, now = new Date()) {
  if (!iso) return null;
  return Math.max(0, Math.round((startOfToday(now).getTime() - new Date(iso + "T00:00:00").getTime()) / DAY));
}

export function ago(d: number | null) {
  if (d === null) return "zatím nikdy";
  if (d <= 0) return "dnes";
  if (d === 1) return "včera";
  if (d < 7) return `před ${d}${NB}dny`;
  if (d < 30) {
    const w = Math.round(d / 7);
    return w === 1 ? "před týdnem" : `před ${w}${NB}týdny`;
  }
  if (d < 365) {
    const mo = Math.round(d / 30);
    return mo === 1 ? "před měsícem" : `před ${mo}${NB}měsíci`;
  }
  const y = Math.round(d / 365);
  return y === 1 ? "před rokem" : `před ${y}${NB}lety`;
}

export function minutes(min: number) {
  if (min < 60) return `${min}${NB}min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}${NB}h ${m}${NB}min` : `${h}${NB}h`;
}

export function longDate(iso: string) {
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso + "T00:00:00"));
}

export function todayLabel(now = new Date()) {
  return cap(new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long" }).format(now));
}

export const list = (items: string[]) => items.join(", ");

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

const ON_DAY = ["v neděli", "v pondělí", "v úterý", "ve středu", "ve čtvrtek", "v pátek", "v sobotu"];
const FOR_DAY = ["na neděli", "na pondělí", "na úterý", "na středu", "na čtvrtek", "na pátek", "na sobotu"];
const offset = (iso: string, now: Date) => Math.round((new Date(iso + "T00:00:00").getTime() - startOfToday(now).getTime()) / DAY);
const weekday = (iso: string) => new Date(iso + "T00:00:00").getDay();

export function onDay(iso: string, now = new Date()) {
  const o = offset(iso, now);
  if (o === 0) return "dnes";
  if (o === 1) return "zítra";
  return tidy(ON_DAY[weekday(iso)]);
}

export function forDay(iso: string, now = new Date()) {
  const o = offset(iso, now);
  if (o === 0) return "na dnešek";
  if (o === 1) return "na zítra";
  return FOR_DAY[weekday(iso)];
}

export function dayChip(iso: string, now = new Date()) {
  const o = offset(iso, now);
  if (o === 0) return "Dnes";
  if (o === 1) return "Zítra";
  const d = new Date(iso + "T00:00:00");
  return `${cap(new Intl.DateTimeFormat("cs-CZ", { weekday: "short" }).format(d))}${NB}${d.getDate()}.`;
}

export function dayTitle(iso: string, now = new Date()) {
  const o = offset(iso, now);
  if (o === 0) return "Dnes";
  if (o === 1) return "Zítra";
  const d = new Date(iso + "T00:00:00");
  return `${cap(new Intl.DateTimeFormat("cs-CZ", { weekday: "long" }).format(d))} ${d.getDate()}.${NB}${d.getMonth() + 1}.`;
}
