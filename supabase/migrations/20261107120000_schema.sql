create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  invite_code text not null unique default lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now()
);

create table public.members (
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  primary key (user_id, household_id)
);
create index members_household_idx on public.members (household_id);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  minutes integer not null check (minutes > 0),
  tags text[] not null default '{}' check (tags <@ array['rychle', 'vikend', 'bezmasa', 'maso', 'polevka', 'sladke']),
  photo_path text,
  created_at timestamptz not null default now()
);
create index meals_household_idx on public.meals (household_id);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  zone text not null default 'spiz' check (zone in ('lednice', 'mrazak', 'spiz')),
  state text not null default 'mame' check (state in ('mame', 'dochazi', 'doslo')),
  tracked boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index ingredients_household_name_idx on public.ingredients (household_id, lower(name));

create table public.meal_ingredients (
  meal_id uuid not null references public.meals (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  primary key (meal_id, ingredient_id)
);
create index meal_ingredients_ingredient_idx on public.meal_ingredients (ingredient_id);

create table public.cook_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  meal_id uuid not null references public.meals (id) on delete cascade,
  cooked_on date not null default current_date,
  cooked_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index cook_log_meal_idx on public.cook_log (meal_id, cooked_on desc);
create index cook_log_household_idx on public.cook_log (household_id);

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  ingredient_id uuid references public.ingredients (id) on delete set null,
  for_meal_id uuid references public.meals (id) on delete set null,
  done boolean not null default false,
  done_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index shopping_items_household_idx on public.shopping_items (household_id);

-- security definer, aby policy na members nezpůsobila rekurzi při vyhodnocení RLS
create function public.is_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.household_id = hid and m.user_id = auth.uid()
  );
$$;
revoke execute on function public.is_member(uuid) from public, anon;
grant execute on function public.is_member(uuid) to authenticated;

alter table public.households enable row level security;
alter table public.members enable row level security;
alter table public.meals enable row level security;
alter table public.ingredients enable row level security;
alter table public.meal_ingredients enable row level security;
alter table public.cook_log enable row level security;
alter table public.shopping_items enable row level security;

create policy "členové čtou domácnost" on public.households
  for select to authenticated using (public.is_member(id));
create policy "členové upravují domácnost" on public.households
  for update to authenticated using (public.is_member(id)) with check (public.is_member(id));

create policy "členové vidí členy" on public.members
  for select to authenticated using (public.is_member(household_id));
create policy "člen upravuje sebe" on public.members
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "člen může odejít" on public.members
  for delete to authenticated using (user_id = auth.uid());

create policy "členové spravují jídla" on public.meals
  for all to authenticated using (public.is_member(household_id)) with check (public.is_member(household_id));
create policy "členové spravují suroviny" on public.ingredients
  for all to authenticated using (public.is_member(household_id)) with check (public.is_member(household_id));
create policy "členové spravují historii vaření" on public.cook_log
  for all to authenticated using (public.is_member(household_id)) with check (public.is_member(household_id));
create policy "členové spravují nákup" on public.shopping_items
  for all to authenticated using (public.is_member(household_id)) with check (public.is_member(household_id));

create policy "členové spravují suroviny jídel" on public.meal_ingredients
  for all to authenticated
  using (exists (select 1 from public.meals m where m.id = meal_id and public.is_member(m.household_id)))
  with check (
    exists (
      select 1 from public.meals m
      join public.ingredients i on i.id = ingredient_id and i.household_id = m.household_id
      where m.id = meal_id and public.is_member(m.household_id)
    )
  );

alter table public.shopping_items replica identity full;
alter table public.ingredients replica identity full;
alter publication supabase_realtime add table public.shopping_items, public.ingredients;

insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false), ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "členové čtou soubory domácnosti" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('meal-photos', 'receipts')
    and (storage.foldername(name))[1] in (select m.household_id::text from public.members m where m.user_id = auth.uid())
  );
create policy "členové nahrávají soubory domácnosti" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('meal-photos', 'receipts')
    and (storage.foldername(name))[1] in (select m.household_id::text from public.members m where m.user_id = auth.uid())
  );
create policy "členové mění soubory domácnosti" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('meal-photos', 'receipts')
    and (storage.foldername(name))[1] in (select m.household_id::text from public.members m where m.user_id = auth.uid())
  );
create policy "členové mažou soubory domácnosti" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('meal-photos', 'receipts')
    and (storage.foldername(name))[1] in (select m.household_id::text from public.members m where m.user_id = auth.uid())
  );
