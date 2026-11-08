# Na talířku

Sdílená aplikace pro domácnost: co si dnes dáme a co nakoupit. Zadání a pravidla jsou v [CLAUDE.md](CLAUDE.md), design v [design/prototype.html](design/prototype.html).

## Rychlý start bez Supabase

```bash
npm install
npm run dev
```

Bez `.env.local` běží aplikace v ukázkovém režimu: data z prototypu se uloží jen do prohlížeče, přihlášení se přeskočí. Hodí se na ladění vzhledu a animací.

## Napojení na Supabase

1. Založ projekt na [supabase.com](https://supabase.com) a nainstaluj CLI (`brew install supabase/tap/supabase`).
2. Propoj repozitář a nahraj migrace:
   ```bash
   supabase link --project-ref <ref-projektu>
   supabase db push
   ```
3. Zkopíruj `.env.example` do `.env.local` a doplň `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
4. V Authentication → URL Configuration nastav Site URL na adresu aplikace (lokálně `http://localhost:5173`, pak doménu z Vercelu) a obě přidej do Redirect URLs.

Lokálně jde všechno pustit i přes Docker: `supabase start`, klíče vypíše `supabase status` a e-maily s odkazem chodí do Inbucketu na `http://127.0.0.1:54324`.

### Čtení fotek do spíže

Účtenky se čtou zdarma přímo v prohlížeči přes Tesseract.js (`src/lib/ocr.ts`): text se rozpozná v telefonu, řádky se spárují se surovinami domácnosti (`src/lib/receipt.ts`) a před uložením je jde upravit. Rozpoznávací data (asi 5 MB) se stáhnou z jsDelivr při prvním použití a pak zůstanou v mezipaměti. Fotky lednice nebo nákupu tímhle způsobem přečíst nejdou, jen tištěný text.

Volitelně jde zapnout čtení přes Claude, které zvládne i fotky lednice, ale platí se za něj. Stačí do Supabase secrets přidat `ANTHROPIC_API_KEY`; aplikace to pozná sama a fotky začne posílat funkci `parse-photos`.

```bash
supabase functions deploy parse-photos
supabase functions deploy device-code
```

### Domácnost

Po prvním přihlášení se založí domácnost s naším katalogem jídel a spíží (`src/data/seed.ts`), zatím bez historie vaření. Druhý člen se přihlásí svým e-mailem a zadá kód domácnosti, který najdeš pod kolečkem vpravo nahoře. Funguje i jeden společný účet.

Odkaz z e-mailu se otevře ve výchozím prohlížeči. Pro přihlášení jinde (jiný prohlížeč, aplikace na ploše telefonu) si v přihlášené aplikaci pod kolečkem nech ukázat kód a na druhém zařízení zvol „Mám kód z jiného zařízení“. Kód vytváří funkce `device-code` bez posílání e-mailu, takže nespotřebuje limit Supabase na 2 e-maily za hodinu.

Jídlo z návrhů nebo z detailu jde poslat ve zprávě, stejně tak nákupní seznam. Zpráva obsahuje odkaz, který v aplikaci otevře přímo dané jídlo nebo sdílený nákup k odškrtávání.

## Deploy na Vercel

Importuj repozitář na Vercelu (framework Vite) a nastav proměnné `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY`. Routování je přes hash, takže žádné rewrites nejsou potřeba.

## Skripty

- `npm run dev`: vývojový server
- `npm run build`: typová kontrola a produkční build s PWA
- `npm test`: testy doporučování a formátování
- `npm run icons`: přegeneruje ikony PWA z `public/icon.svg`
- `npm run seed:sql`: vypíše SQL seed funkce z `src/data/seed.ts` (při změně seedu ho ulož jako novou migraci)
