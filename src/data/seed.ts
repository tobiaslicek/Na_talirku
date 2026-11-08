import type { Tag, Zone, IngredientState } from "../lib/types";

export interface SeedMeal {
  art: string;
  name: string;
  minutes: number;
  tags: Tag[];
  lastDaysAgo: number;
  ingredients: string[];
}

export const SEED_MEALS: SeedMeal[] = [
  { art: "citronove", name: "Citronové špagety", minutes: 20, tags: ["rychle"], lastDaysAgo: 4, ingredients: ["špagety", "citron", "máslo", "olivový olej", "česnek", "parmazán", "chilli"] },
  { art: "paprikove", name: "Paprikové špagety", minutes: 25, tags: ["rychle"], lastDaysAgo: 9, ingredients: ["špagety", "uzená paprika", "cherry rajčata", "parmazán", "kešu"] },
  { art: "pecene", name: "Špagety s pečenou omáčkou", minutes: 45, tags: [], lastDaysAgo: 16, ingredients: ["špagety", "cherry rajčata", "česnek", "špenát", "olivový olej", "parmazán"] },
  { art: "aglio", name: "Aglio e olio", minutes: 15, tags: ["rychle"], lastDaysAgo: 6, ingredients: ["špagety", "česnek", "olivový olej", "chilli"] },
  { art: "ramen", name: "Vege ramen", minutes: 30, tags: ["polevka", "rychle"], lastDaysAgo: 12, ingredients: ["zeleninový vývar", "ramen nudle", "shiitake", "kukuřice", "tofu"] },
  { art: "wrap", name: "Řecký wrap", minutes: 20, tags: ["rychle"], lastDaysAgo: 7, ingredients: ["tortilly", "vege kuřecí kousky", "rajčata", "okurka", "salát", "řecký jogurt", "bylinky", "česnek", "citron"] },
  { art: "zavitky", name: "Letní závitky", minutes: 45, tags: ["vikend"], lastDaysAgo: 24, ingredients: ["rýžový papír", "rýžové nudle", "tofu", "okurka", "avokádo", "arašídové máslo", "rýžový olej", "hořčice", "javorový sirup", "česnek"] },
  { art: "tacos", name: "Tacos", minutes: 30, tags: ["rychle"], lastDaysAgo: 11, ingredients: ["tortilly", "fazole", "rajčata", "kukuřice", "česnek", "cibule", "salsa", "čedar", "avokádo", "zakysaná smetana"] },
  { art: "shakshuka", name: "Shakshuka", minutes: 30, tags: ["rychle", "vikend"], lastDaysAgo: 30, ingredients: ["vejce", "loupaná rajčata", "paprika", "cibule", "česnek"] },
  { art: "tofu", name: "Tofu ve sladkokyselé chilli omáčce", minutes: 25, tags: ["rychle"], lastDaysAgo: 5, ingredients: ["tofu", "sladkokyselá chilli omáčka", "mražená zelenina", "rýže"] },
];

export const SEED_PANTRY: Record<Zone, [string, IngredientState][]> = {
  lednice: [["máslo", "mame"], ["parmazán", "mame"], ["vejce", "mame"], ["mléko", "mame"], ["tofu", "dochazi"], ["citron", "mame"], ["cherry rajčata", "mame"], ["rajčata", "doslo"], ["paprika", "mame"], ["okurka", "doslo"], ["salát", "doslo"], ["avokádo", "doslo"], ["špenát", "doslo"], ["bylinky", "doslo"], ["shiitake", "doslo"], ["řecký jogurt", "doslo"], ["zakysaná smetana", "doslo"], ["čedar", "doslo"]],
  mrazak: [["mražená zelenina", "mame"], ["vege kuřecí kousky", "dochazi"]],
  spiz: [["špagety", "mame"], ["ramen nudle", "mame"], ["rýžové nudle", "mame"], ["rýžový papír", "mame"], ["rýže", "mame"], ["tortilly", "dochazi"], ["olivový olej", "mame"], ["rýžový olej", "mame"], ["česnek", "mame"], ["cibule", "mame"], ["chilli", "mame"], ["uzená paprika", "mame"], ["kešu", "mame"], ["zeleninový vývar", "mame"], ["kukuřice", "mame"], ["fazole", "mame"], ["loupaná rajčata", "mame"], ["arašídové máslo", "mame"], ["hořčice", "mame"], ["javorový sirup", "mame"], ["salsa", "mame"], ["sladkokyselá chilli omáčka", "mame"]],
};

export const SEED_SHOP = ["banány", "bílé jogurty", "rohlíky"];
