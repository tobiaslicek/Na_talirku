# Talířek

Sdílená aplikace pro domácnost (já + manželka), která řeší každodenní „co si dnes dáme a co nakoupit“. Cíl: dostat se od „nevím“ k „tohle uvaříme a tohle dokoupíme“ do 30 sekund. Používá se hlavně na mobilu (PWA přidaná na plochu), ale musí fungovat i na desktopu.

## Zdroj designu

`design/prototype.html` je klikací prototyp. Je to jediný zdroj pravdy pro vzhled, texty a chování.

- Implementuj **jen styl „Mix“** (výchozí v prototypu): cibulákový porcelán + krojové prvky (věneček kolem hlavního talíře, stuha s růžičkami jako oddělovač, prošití kolem tlačítka „Poraď mi“). Styly „Cibulák“ a „Kroj“ i přepínač stylů jsou v prototypu jen kvůli porovnání, do aplikace nepatří.
- Převezmi barevné tokeny (CSS custom properties v `:root`, světlý i tmavý režim), typografii (Fraunces pro nadpisy, Instrument Sans pro UI), SVG talíř s okrajem cibuláku, věneček, vzor stuhy a ilustrace jídel.
- Ilustrace jídel v prototypu jsou dočasné. Ve fázi 3 je nahradí generované fotky (shora na cibulákovém talíři), komponenta talíře musí umět zobrazit fotku místo ilustrace.
- Ukázková data (`MEALS`, `PANTRY`) v prototypu použij jako seed, dokud nedodám skutečný seznam jídel.

## Stack

- Vite + React + TypeScript, PWA přes `vite-plugin-pwa` (ikona, offline shell, `display: standalone`)
- Supabase: Auth, Postgres s RLS, Storage (fotky jídel, účtenky), Realtime
- GSAP + ScrollTrigger + `@gsap/react` (`useGSAP` kvůli úklidu), `gsap.matchMedia()` pro `prefers-reduced-motion`
- Styly: CSS s custom properties podle tokenů z prototypu
- AI volání výhradně přes Supabase Edge Functions, klíče jen jako Supabase secrets
- Deploy na Vercel z GitHubu

## Pravidla pro kód

- Žádné dekorativní ani „AI“ komentáře v kódu (bannery, vysvětlivky typu „Vložit do…“). Komentář jen tam, kde vysvětluje neočividné rozhodnutí.
- Mobile first, safe-area insety (`viewport-fit=cover`), světlý i tmavý režim podle systému.
- Animovat jen `transform` a `opacity`. Při `prefers-reduced-motion` animace vypnout.
- UI v češtině, věty s malým písmenem na začátku popisků, žádné popisky VELKÝMI PÍSMENY.
- Nezlomitelná mezera po jednopísmenných předložkách (s, v, k, z, o, u) a mezi číslem a jednotkou (30 min).
- Tlačítka mají `:active` zmenšení, dostupný focus, minimální dotyková plocha 44 px.

## Datový model

```
households        id, name, created_at
members           user_id → auth.users, household_id, display_name
meals             id, household_id, name, minutes, tags text[], photo_path, created_at
ingredients       id, household_id, name, zone (lednice|mrazak|spiz), state (mame|dochazi|doslo), tracked bool
meal_ingredients  meal_id, ingredient_id
cook_log          id, household_id, meal_id, cooked_on date, cooked_by
shopping_items    id, household_id, name, ingredient_id null, for_meal_id null, done bool, done_at, created_by
```

- Tagy: `rychle`, `vikend`, `bezmasa`, `maso`, `polevka`, `sladke`.
- RLS: každý řádek je čitelný a zapisovatelný jen pro členy dané domácnosti.
- Realtime odběr na `shopping_items` a `ingredients`, aby oba viděli změny okamžitě (typicky v obchodě).
- Přihlášení: e-mail (magic link). Buď jeden společný účet, nebo dva účty v jedné domácnosti; datový model podporuje obojí.

## Doporučování (bez AI)

Pro každé jídlo:

```
pokrytí  = počet surovin se stavem mame nebo dochazi / počet surovin
dní      = min(dny od posledního záznamu v cook_log, 45)
skóre    = pokrytí × 55 + dní × 0,9 + náhoda(0–22)
```

- Vyřaď jídla vařená v posledních 2 dnech.
- Filtry: čas (do 30 min, do hodiny, je to jedno) a chuť (tag nebo cokoliv).
- Vrať 3 jídla. „Jiné tři“ vrátí další trojici a pokud to jde, vynechá ty předchozí.

## Klíčové toky

- **Dnes:** prázdný talíř s věnečkem a tlačítkem „Poraď mi“. Tlačítko roztočí talíř a ukáže 3 návrhy. U každého: čas, „naposled před…“, „Všechno máme doma“ nebo „Dokoupit: …“.
- **Tohle uvaříme:** zapíše dnešek do `cook_log` a chybějící suroviny přidá do nákupu s odkazem na jídlo. Potvrzení přes toast.
- **Dlouho jsme neměli:** jídla, která nebyla 21+ dní, seřazená od nejstaršího.
- **Dochází:** suroviny ve stavu `dochazi`, tlačítko „Přidat do nákupu“.
- **Jídla:** mřížka talířů, filtry podle tagů, detail v bottom sheetu (suroviny se stavem, „Tohle uvaříme“, „Přidat chybějící do nákupu“). Sheet jde zavřít tažením dolů.
- **Doma (spíž):** zóny Lednice, Mrazák, Spíž. Klepnutí cykluje stav máme → dochází → došlo.
- **Nákup:** přidání položky, odškrtnutí. Odškrtnutá položka napojená na surovinu nastaví její stav na `mame`. „Smazat koupené“.

## Animace

- Úvod na obrazovce Dnes: talíř se dotočí, vzor okraje se „namaluje“ (vine stroke + motivy po obvodu), věneček se rozvine od středu, nadpis a filtry najedou.
- Scroll: hlavní talíř se při scrollu pootáčí a mírně zmenšuje (scrub), stuha se „prošije“ zleva doprava, talíře v seznamech a v katalogu se při vjetí do obrazu dotočí na místo (`ScrollTrigger.batch`, `once: true`).
- Stín talíře je na obalu, který se netočí; točí se jen vnitřní SVG.
- Reakce na akce (sheet, toast, odškrtnutí) do 300 ms se silným ease-out.

## AI (fáze 3)

- `parse-receipt`: fotka účtenky → vision model → JSON `[{ raw, name, ingredient_id | null }]` → potvrzovací obrazovka (ukázka je v prototypu v záložce Doma) → uložit stavy a odškrtnout odpovídající položky v nákupu.
- `suggest-from-text`: volný text („mám půlku zelí a slaninu“) → návrhy z katalogu, případně nové jídlo.
- `generate-photo`: fotka jídla přes OpenAI Images podle šablony níže, uložit do Storage, jedna fotka na jídlo.

Šablona promptu pro fotky:

```
Top-down food photo of [jídlo a jeho složky], served on a white Czech blue onion pattern (cibulák) porcelain plate, plate fully visible and centered, plain light linen background, soft window daylight, homemade look, no hands, no text, square 1:1
```

## Fáze

1. Projekt, PWA, přihlášení, domácnost, jídla (přidat/upravit), katalog, Poraď mi, historie vaření, sdílený nákup s realtime.
2. Spíž se třemi stavy a propojení nákup → spíž.
3. AI: účtenky, volný text, generování fotek. Případně týdenní plán.

## Prostředí

- `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Do gitu jen `.env.example`.
- Klíče k AI (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) patří jen do Supabase secrets, nikdy do frontendu ani do systémových proměnných prostředí.
- Migrace databáze přes Supabase CLI ve složce `supabase/migrations`.
