create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.seed_household(hid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  pantry jsonb := '[{"name":"máslo","zone":"lednice","state":"mame"},{"name":"parmazán","zone":"lednice","state":"mame"},{"name":"vejce","zone":"lednice","state":"mame"},{"name":"mléko","zone":"lednice","state":"mame"},{"name":"tofu","zone":"lednice","state":"dochazi"},{"name":"citron","zone":"lednice","state":"mame"},{"name":"cherry rajčata","zone":"lednice","state":"mame"},{"name":"rajčata","zone":"lednice","state":"doslo"},{"name":"paprika","zone":"lednice","state":"mame"},{"name":"okurka","zone":"lednice","state":"doslo"},{"name":"salát","zone":"lednice","state":"doslo"},{"name":"avokádo","zone":"lednice","state":"doslo"},{"name":"špenát","zone":"lednice","state":"doslo"},{"name":"bylinky","zone":"lednice","state":"doslo"},{"name":"shiitake","zone":"lednice","state":"doslo"},{"name":"řecký jogurt","zone":"lednice","state":"doslo"},{"name":"zakysaná smetana","zone":"lednice","state":"doslo"},{"name":"čedar","zone":"lednice","state":"doslo"},{"name":"mražená zelenina","zone":"mrazak","state":"mame"},{"name":"vege kuřecí kousky","zone":"mrazak","state":"dochazi"},{"name":"špagety","zone":"spiz","state":"mame"},{"name":"ramen nudle","zone":"spiz","state":"mame"},{"name":"rýžové nudle","zone":"spiz","state":"mame"},{"name":"rýžový papír","zone":"spiz","state":"mame"},{"name":"rýže","zone":"spiz","state":"mame"},{"name":"tortilly","zone":"spiz","state":"dochazi"},{"name":"olivový olej","zone":"spiz","state":"mame"},{"name":"rýžový olej","zone":"spiz","state":"mame"},{"name":"česnek","zone":"spiz","state":"mame"},{"name":"cibule","zone":"spiz","state":"mame"},{"name":"chilli","zone":"spiz","state":"mame"},{"name":"uzená paprika","zone":"spiz","state":"mame"},{"name":"kešu","zone":"spiz","state":"mame"},{"name":"zeleninový vývar","zone":"spiz","state":"mame"},{"name":"kukuřice","zone":"spiz","state":"mame"},{"name":"fazole","zone":"spiz","state":"mame"},{"name":"loupaná rajčata","zone":"spiz","state":"mame"},{"name":"arašídové máslo","zone":"spiz","state":"mame"},{"name":"hořčice","zone":"spiz","state":"mame"},{"name":"javorový sirup","zone":"spiz","state":"mame"},{"name":"salsa","zone":"spiz","state":"mame"},{"name":"sladkokyselá chilli omáčka","zone":"spiz","state":"mame"}]'::jsonb;
  meals jsonb := '[{"name":"Citronové špagety","minutes":20,"tags":["rychle"],"ingredients":["špagety","citron","máslo","olivový olej","česnek","parmazán","chilli"]},{"name":"Paprikové špagety","minutes":25,"tags":["rychle"],"ingredients":["špagety","uzená paprika","cherry rajčata","parmazán","kešu"]},{"name":"Špagety s pečenou omáčkou","minutes":45,"tags":[],"ingredients":["špagety","cherry rajčata","česnek","špenát","olivový olej","parmazán"]},{"name":"Aglio e olio","minutes":15,"tags":["rychle"],"ingredients":["špagety","česnek","olivový olej","chilli"]},{"name":"Vege ramen","minutes":30,"tags":["polevka","rychle"],"ingredients":["zeleninový vývar","ramen nudle","shiitake","kukuřice","tofu"]},{"name":"Řecký wrap","minutes":20,"tags":["rychle"],"ingredients":["tortilly","vege kuřecí kousky","rajčata","okurka","salát","řecký jogurt","bylinky","česnek","citron"]},{"name":"Letní závitky","minutes":45,"tags":["vikend"],"ingredients":["rýžový papír","rýžové nudle","tofu","okurka","avokádo","arašídové máslo","rýžový olej","hořčice","javorový sirup","česnek"]},{"name":"Tacos","minutes":30,"tags":["rychle"],"ingredients":["tortilly","fazole","rajčata","kukuřice","česnek","cibule","salsa","čedar","avokádo","zakysaná smetana"]},{"name":"Shakshuka","minutes":30,"tags":["rychle","vikend"],"ingredients":["vejce","loupaná rajčata","paprika","cibule","česnek"]},{"name":"Tofu ve sladkokyselé chilli omáčce","minutes":25,"tags":["rychle"],"ingredients":["tofu","sladkokyselá chilli omáčka","mražená zelenina","rýže"]}]'::jsonb;
  m jsonb;
  mid uuid;
begin
  insert into public.ingredients (household_id, name, zone, state)
  select hid, x ->> 'name', x ->> 'zone', x ->> 'state' from jsonb_array_elements(pantry) x
  on conflict (household_id, lower(name)) do nothing;

  for m in select * from jsonb_array_elements(meals) loop
    continue when exists (select 1 from public.meals where household_id = hid and lower(name) = lower(m ->> 'name'));

    insert into public.meals (household_id, name, minutes, tags)
    values (hid, m ->> 'name', (m ->> 'minutes')::int, array(select jsonb_array_elements_text(m -> 'tags')))
    returning id into mid;

    insert into public.meal_ingredients (meal_id, ingredient_id)
    select mid, i.id from public.ingredients i
    where i.household_id = hid and lower(i.name) in (select lower(t) from jsonb_array_elements_text(m -> 'ingredients') t);
  end loop;
end;
$$;

create or replace function public.create_household(p_name text, p_display_name text)
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

create or replace function public.join_household(p_code text, p_display_name text)
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

-- Replaces the prototype sample meals in existing households with the household's own list. Only rows that came from the old seed are removed; meals and ingredients added by hand stay.
do $$
declare
  h record;
begin
  for h in select id from public.households loop
    delete from public.meals where household_id = h.id and lower(name) = any (array['svíčková na smetaně', 'hovězí guláš', 'řízek s bramborovým salátem', 'kuře na paprice', 'koprová omáčka s vejcem', 'rajská omáčka s masem', 'bramboráky', 'čočka na kyselo', 'kulajda', 'česnečka', 'buchtičky se šodó', 'boloňské špagety', 'smažený sýr s hranolky', 'ovocné knedlíky', 'vepřo knedlo zelo', 'krupicová kaše']);
    perform private.seed_household(h.id);
    delete from public.ingredients i
    where i.household_id = h.id
      and lower(i.name) = any (array['smetana ke šlehání', 'tvaroh', 'eidam', 'majonéza', 'tatarka', 'mrkev', 'kopr', 'droždí', 'kysané zelí', 'houby', 'hovězí zadní', 'hovězí kližka', 'kuřecí stehna', 'vepřová kotleta', 'vepřová plec', 'mletá směs', 'hranolky', 'borůvky', 'kořenová zelenina', 'houskový knedlík', 'brambory', 'hladká mouka', 'hrubá mouka', 'strouhanka', 'krupice', 'cukr', 'těstoviny', 'čočka', 'rajský protlak', 'sladká paprika', 'kmín', 'majoránka', 'skořice', 'kakao', 'ocet', 'olej', 'sterilované okurky', 'brusinky', 'chléb', 'bílé víno'])
      and not exists (select 1 from public.meal_ingredients mi where mi.ingredient_id = i.id);
  end loop;
end;
$$;
