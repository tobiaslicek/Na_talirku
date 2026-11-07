import { SEED_MEALS, SEED_PANTRY, SEED_SHOP } from "../src/data/seed.ts";

const pantry = Object.entries(SEED_PANTRY).flatMap(([zone, items]) => items.map(([name, state]) => ({ name, zone, state })));
const known = new Set(pantry.map((p) => p.name));
for (const m of SEED_MEALS) {
  for (const i of m.ingredients) {
    if (!known.has(i)) {
      pantry.push({ name: i, zone: "spiz", state: "doslo" });
      known.add(i);
    }
  }
}
const meals = SEED_MEALS.map((m) => ({ name: m.name, minutes: m.minutes, tags: m.tags, last: m.lastDaysAgo, ingredients: m.ingredients }));

const lit = (v) => `'${JSON.stringify(v).replaceAll("'", "''")}'::jsonb`;

process.stdout.write(`create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.seed_household(hid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  pantry jsonb := ${lit(pantry)};
  meals jsonb := ${lit(meals)};
  shop jsonb := ${lit(SEED_SHOP)};
  m jsonb;
  mid uuid;
begin
  insert into public.ingredients (household_id, name, zone, state)
  select hid, x ->> 'name', x ->> 'zone', x ->> 'state' from jsonb_array_elements(pantry) x;

  for m in select * from jsonb_array_elements(meals) loop
    insert into public.meals (household_id, name, minutes, tags)
    values (hid, m ->> 'name', (m ->> 'minutes')::int, array(select jsonb_array_elements_text(m -> 'tags')))
    returning id into mid;

    insert into public.meal_ingredients (meal_id, ingredient_id)
    select mid, i.id from public.ingredients i
    where i.household_id = hid and i.name in (select jsonb_array_elements_text(m -> 'ingredients'));

    insert into public.cook_log (household_id, meal_id, cooked_on, cooked_by)
    values (hid, mid, current_date - (m ->> 'last')::int, null);
  end loop;

  insert into public.shopping_items (household_id, name, created_by)
  select hid, s, null from jsonb_array_elements_text(shop) s;
end;
$$;

create function public.create_household(p_name text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  hid uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.households (name) values (coalesce(nullif(trim(p_name), ''), 'Domácnost')) returning id into hid;
  insert into public.members (user_id, household_id, display_name) values (auth.uid(), hid, coalesce(trim(p_display_name), ''));
  perform private.seed_household(hid);
  return hid;
end;
$$;

create function public.join_household(p_code text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  hid uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select id into hid from public.households where invite_code = lower(trim(p_code));
  if hid is null then
    raise exception 'invalid invite code' using errcode = 'P0002';
  end if;
  insert into public.members (user_id, household_id, display_name)
  values (auth.uid(), hid, coalesce(trim(p_display_name), ''))
  on conflict (user_id, household_id) do nothing;
  return hid;
end;
$$;

revoke execute on function public.create_household(text, text) from public, anon;
revoke execute on function public.join_household(text, text) from public, anon;
grant execute on function public.create_household(text, text) to authenticated;
grant execute on function public.join_household(text, text) to authenticated;
`);
