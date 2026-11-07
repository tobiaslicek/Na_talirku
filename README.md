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

Funkce `parse-photos` posílá fotky účtenek, nákupu nebo lednice do Claude a vrací seznam položek k potvrzení. Klíč patří jen do Supabase secrets:

```bash
supabase secrets set ANTHROPIC_API_KEY=...
supabase functions deploy parse-photos
```

### Domácnost

Po prvním přihlášení se založí domácnost i s ukázkovými jídly a spíží. Druhý člen se přihlásí svým e-mailem a zadá kód domácnosti, který najdeš pod kolečkem vpravo nahoře. Funguje i jeden společný účet.

Jídlo z návrhů nebo z detailu jde poslat ve zprávě, stejně tak nákupní seznam. Zpráva obsahuje odkaz, který v aplikaci otevře přímo dané jídlo nebo sdílený nákup k odškrtávání.

## Deploy na Vercel

Importuj repozitář na Vercelu (framework Vite) a nastav proměnné `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY`. Routování je přes hash, takže žádné rewrites nejsou potřeba.

## Skripty

- `npm run dev`: vývojový server
- `npm run build`: typová kontrola a produkční build s PWA
- `npm test`: testy doporučování a formátování
- `npm run icons`: přegeneruje ikony PWA z `public/icon.svg`
- `npm run seed:sql`: vypíše SQL seed funkce z `src/data/seed.ts` (při změně seedu ho ulož jako novou migraci)
