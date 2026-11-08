alter table public.hidden_ideas rename to idea_votes;
alter table public.idea_votes add column vote text not null default 'ne' check (vote in ('ne', 'chceme'));
alter policy "členové spravují skryté nápady" on public.idea_votes rename to "členové hlasují o nápadech";

-- Plán je cook_log s budoucím datem, takže ho oba telefony potřebují vidět hned.
alter table public.cook_log replica identity full;
alter publication supabase_realtime add table public.cook_log;
