alter table public.meals add column recipe text;

create table public.hidden_ideas (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  idea_id text not null,
  created_at timestamptz not null default now(),
  unique (household_id, idea_id)
);

alter table public.hidden_ideas enable row level security;

create policy "členové spravují skryté nápady" on public.hidden_ideas
  for all to authenticated using (public.is_member(household_id)) with check (public.is_member(household_id));
