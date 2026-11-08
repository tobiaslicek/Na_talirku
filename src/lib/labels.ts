import type { IngredientState, Tag, Zone } from "./types";
import type { MoodPref, TimePref } from "./recommend";

export const TAG_LABEL: Record<Tag, string> = { rychle: "Rychlovka", vikend: "Na víkend", bezmasa: "Bez masa", maso: "S masem", polevka: "Polévka", sladke: "Sladké" };
export const TIME_OPTIONS: [TimePref, string][] = [[999, "Je to jedno"], [30, "Do půl hodiny"], [60, "Do hodiny"]];
export const MOOD_OPTIONS: [MoodPref, string][] = [["any", "Cokoliv"], ["polevka", "Polévka"], ["vikend", "Něco na víkend"], ["bezmasa", "Bez masa"], ["maso", "S masem"], ["sladke", "Sladké"]];
export type Source = "mix" | "nase" | "nove";
export const SOURCE_OPTIONS: [Source, string][] = [["mix", "Obojí"], ["nase", "Osvědčené"], ["nove", "Něco nového"]];
export const FILTER_OPTIONS: [Tag | "all", string][] = [["all", "Vše"], ["rychle", "Rychlovky"], ["polevka", "Polévky"], ["bezmasa", "Bez masa"], ["maso", "S masem"], ["vikend", "Na víkend"], ["sladke", "Sladké"]];
export const ZONE_LABEL: Record<Zone, string> = { lednice: "Lednice", mrazak: "Mrazák", spiz: "Spíž" };
export const STATE_LABEL: Record<IngredientState, string> = { mame: "máme", dochazi: "dochází", doslo: "došlo" };
