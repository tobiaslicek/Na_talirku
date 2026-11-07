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
  { art: "svickova", name: "Svíčková na smetaně", minutes: 150, tags: ["vikend", "maso"], lastDaysAgo: 23, ingredients: ["hovězí zadní", "kořenová zelenina", "cibule", "smetana ke šlehání", "houskový knedlík", "brusinky", "citron"] },
  { art: "gulas", name: "Hovězí guláš", minutes: 150, tags: ["vikend", "maso"], lastDaysAgo: 12, ingredients: ["hovězí kližka", "cibule", "sladká paprika", "kmín", "česnek", "houskový knedlík"] },
  { art: "rizek", name: "Řízek s bramborovým salátem", minutes: 60, tags: ["maso"], lastDaysAgo: 9, ingredients: ["vepřová kotleta", "vejce", "hladká mouka", "strouhanka", "brambory", "sterilované okurky", "majonéza", "mrkev"] },
  { art: "kure", name: "Kuře na paprice", minutes: 50, tags: ["maso"], lastDaysAgo: 5, ingredients: ["kuřecí stehna", "cibule", "sladká paprika", "smetana ke šlehání", "hladká mouka", "těstoviny"] },
  { art: "koprovka", name: "Koprová omáčka s vejcem", minutes: 35, tags: ["bezmasa"], lastDaysAgo: 41, ingredients: ["kopr", "mléko", "smetana ke šlehání", "hladká mouka", "máslo", "vejce", "brambory", "ocet"] },
  { art: "rajska", name: "Rajská omáčka s masem", minutes: 120, tags: ["vikend", "maso"], lastDaysAgo: 60, ingredients: ["hovězí zadní", "rajský protlak", "kořenová zelenina", "cukr", "skořice", "houskový knedlík"] },
  { art: "bramboraky", name: "Bramboráky", minutes: 40, tags: ["bezmasa"], lastDaysAgo: 34, ingredients: ["brambory", "vejce", "hladká mouka", "česnek", "majoránka", "olej"] },
  { art: "cocka", name: "Čočka na kyselo", minutes: 40, tags: ["bezmasa"], lastDaysAgo: 18, ingredients: ["čočka", "cibule", "hladká mouka", "ocet", "vejce", "sterilované okurky"] },
  { art: "kulajda", name: "Kulajda", minutes: 40, tags: ["polevka", "bezmasa"], lastDaysAgo: 27, ingredients: ["brambory", "houby", "smetana ke šlehání", "kopr", "vejce", "ocet"] },
  { art: "cesnecka", name: "Česnečka", minutes: 20, tags: ["polevka", "bezmasa", "rychle"], lastDaysAgo: 15, ingredients: ["česnek", "brambory", "kmín", "majoránka", "chléb", "eidam"] },
  { art: "buchticky", name: "Buchtičky se šodó", minutes: 60, tags: ["sladke", "bezmasa"], lastDaysAgo: 70, ingredients: ["hladká mouka", "droždí", "mléko", "máslo", "vejce", "cukr", "bílé víno"] },
  { art: "spagety", name: "Boloňské špagety", minutes: 30, tags: ["maso", "rychle"], lastDaysAgo: 3, ingredients: ["špagety", "mletá směs", "rajský protlak", "cibule", "česnek", "parmazán"] },
  { art: "syr", name: "Smažený sýr s hranolky", minutes: 25, tags: ["bezmasa", "rychle"], lastDaysAgo: 20, ingredients: ["eidam", "vejce", "hladká mouka", "strouhanka", "hranolky", "tatarka"] },
  { art: "ovocne", name: "Ovocné knedlíky", minutes: 50, tags: ["sladke", "bezmasa"], lastDaysAgo: 45, ingredients: ["tvaroh", "hrubá mouka", "vejce", "borůvky", "máslo", "cukr"] },
  { art: "vepro", name: "Vepřo knedlo zelo", minutes: 120, tags: ["vikend", "maso"], lastDaysAgo: 38, ingredients: ["vepřová plec", "kysané zelí", "cibule", "kmín", "houskový knedlík"] },
  { art: "kase", name: "Krupicová kaše", minutes: 15, tags: ["sladke", "bezmasa", "rychle"], lastDaysAgo: 11, ingredients: ["krupice", "mléko", "máslo", "cukr", "kakao"] },
];

export const SEED_PANTRY: Record<Zone, [string, IngredientState][]> = {
  lednice: [["máslo", "dochazi"], ["vejce", "mame"], ["mléko", "mame"], ["smetana ke šlehání", "doslo"], ["tvaroh", "doslo"], ["eidam", "mame"], ["parmazán", "mame"], ["majonéza", "dochazi"], ["tatarka", "doslo"], ["mrkev", "mame"], ["kopr", "doslo"], ["citron", "mame"], ["droždí", "doslo"], ["kysané zelí", "doslo"], ["houby", "doslo"]],
  mrazak: [["hovězí zadní", "mame"], ["hovězí kližka", "doslo"], ["kuřecí stehna", "mame"], ["vepřová kotleta", "doslo"], ["vepřová plec", "doslo"], ["mletá směs", "mame"], ["hranolky", "mame"], ["borůvky", "mame"], ["kořenová zelenina", "mame"], ["houskový knedlík", "dochazi"]],
  spiz: [["brambory", "mame"], ["cibule", "mame"], ["česnek", "dochazi"], ["hladká mouka", "mame"], ["hrubá mouka", "mame"], ["strouhanka", "mame"], ["krupice", "mame"], ["cukr", "mame"], ["těstoviny", "mame"], ["špagety", "mame"], ["čočka", "mame"], ["rajský protlak", "mame"], ["sladká paprika", "mame"], ["kmín", "mame"], ["majoránka", "mame"], ["skořice", "mame"], ["kakao", "mame"], ["ocet", "mame"], ["olej", "mame"], ["sterilované okurky", "mame"], ["brusinky", "doslo"], ["chléb", "dochazi"], ["bílé víno", "doslo"]],
};

export const SEED_SHOP = ["banány", "bílé jogurty", "rohlíky"];
