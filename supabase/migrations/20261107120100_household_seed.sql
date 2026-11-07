create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.seed_household(hid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  pantry jsonb := '[{"name":"máslo","zone":"lednice","state":"dochazi"},{"name":"vejce","zone":"lednice","state":"mame"},{"name":"mléko","zone":"lednice","state":"mame"},{"name":"smetana ke šlehání","zone":"lednice","state":"doslo"},{"name":"tvaroh","zone":"lednice","state":"doslo"},{"name":"eidam","zone":"lednice","state":"mame"},{"name":"parmazán","zone":"lednice","state":"mame"},{"name":"majonéza","zone":"lednice","state":"dochazi"},{"name":"tatarka","zone":"lednice","state":"doslo"},{"name":"mrkev","zone":"lednice","state":"mame"},{"name":"kopr","zone":"lednice","state":"doslo"},{"name":"citron","zone":"lednice","state":"mame"},{"name":"droždí","zone":"lednice","state":"doslo"},{"name":"kysané zelí","zone":"lednice","state":"doslo"},{"name":"houby","zone":"lednice","state":"doslo"},{"name":"hovězí zadní","zone":"mrazak","state":"mame"},{"name":"hovězí kližka","zone":"mrazak","state":"doslo"},{"name":"kuřecí stehna","zone":"mrazak","state":"mame"},{"name":"vepřová kotleta","zone":"mrazak","state":"doslo"},{"name":"vepřová plec","zone":"mrazak","state":"doslo"},{"name":"mletá směs","zone":"mrazak","state":"mame"},{"name":"hranolky","zone":"mrazak","state":"mame"},{"name":"borůvky","zone":"mrazak","state":"mame"},{"name":"kořenová zelenina","zone":"mrazak","state":"mame"},{"name":"houskový knedlík","zone":"mrazak","state":"dochazi"},{"name":"brambory","zone":"spiz","state":"mame"},{"name":"cibule","zone":"spiz","state":"mame"},{"name":"česnek","zone":"spiz","state":"dochazi"},{"name":"hladká mouka","zone":"spiz","state":"mame"},{"name":"hrubá mouka","zone":"spiz","state":"mame"},{"name":"strouhanka","zone":"spiz","state":"mame"},{"name":"krupice","zone":"spiz","state":"mame"},{"name":"cukr","zone":"spiz","state":"mame"},{"name":"těstoviny","zone":"spiz","state":"mame"},{"name":"špagety","zone":"spiz","state":"mame"},{"name":"čočka","zone":"spiz","state":"mame"},{"name":"rajský protlak","zone":"spiz","state":"mame"},{"name":"sladká paprika","zone":"spiz","state":"mame"},{"name":"kmín","zone":"spiz","state":"mame"},{"name":"majoránka","zone":"spiz","state":"mame"},{"name":"skořice","zone":"spiz","state":"mame"},{"name":"kakao","zone":"spiz","state":"mame"},{"name":"ocet","zone":"spiz","state":"mame"},{"name":"olej","zone":"spiz","state":"mame"},{"name":"sterilované okurky","zone":"spiz","state":"mame"},{"name":"brusinky","zone":"spiz","state":"doslo"},{"name":"chléb","zone":"spiz","state":"dochazi"},{"name":"bílé víno","zone":"spiz","state":"doslo"}]'::jsonb;
  meals jsonb := '[{"name":"Svíčková na smetaně","minutes":150,"tags":["vikend","maso"],"last":23,"ingredients":["hovězí zadní","kořenová zelenina","cibule","smetana ke šlehání","houskový knedlík","brusinky","citron"]},{"name":"Hovězí guláš","minutes":150,"tags":["vikend","maso"],"last":12,"ingredients":["hovězí kližka","cibule","sladká paprika","kmín","česnek","houskový knedlík"]},{"name":"Řízek s bramborovým salátem","minutes":60,"tags":["maso"],"last":9,"ingredients":["vepřová kotleta","vejce","hladká mouka","strouhanka","brambory","sterilované okurky","majonéza","mrkev"]},{"name":"Kuře na paprice","minutes":50,"tags":["maso"],"last":5,"ingredients":["kuřecí stehna","cibule","sladká paprika","smetana ke šlehání","hladká mouka","těstoviny"]},{"name":"Koprová omáčka s vejcem","minutes":35,"tags":["bezmasa"],"last":41,"ingredients":["kopr","mléko","smetana ke šlehání","hladká mouka","máslo","vejce","brambory","ocet"]},{"name":"Rajská omáčka s masem","minutes":120,"tags":["vikend","maso"],"last":60,"ingredients":["hovězí zadní","rajský protlak","kořenová zelenina","cukr","skořice","houskový knedlík"]},{"name":"Bramboráky","minutes":40,"tags":["bezmasa"],"last":34,"ingredients":["brambory","vejce","hladká mouka","česnek","majoránka","olej"]},{"name":"Čočka na kyselo","minutes":40,"tags":["bezmasa"],"last":18,"ingredients":["čočka","cibule","hladká mouka","ocet","vejce","sterilované okurky"]},{"name":"Kulajda","minutes":40,"tags":["polevka","bezmasa"],"last":27,"ingredients":["brambory","houby","smetana ke šlehání","kopr","vejce","ocet"]},{"name":"Česnečka","minutes":20,"tags":["polevka","bezmasa","rychle"],"last":15,"ingredients":["česnek","brambory","kmín","majoránka","chléb","eidam"]},{"name":"Buchtičky se šodó","minutes":60,"tags":["sladke","bezmasa"],"last":70,"ingredients":["hladká mouka","droždí","mléko","máslo","vejce","cukr","bílé víno"]},{"name":"Boloňské špagety","minutes":30,"tags":["maso","rychle"],"last":3,"ingredients":["špagety","mletá směs","rajský protlak","cibule","česnek","parmazán"]},{"name":"Smažený sýr s hranolky","minutes":25,"tags":["bezmasa","rychle"],"last":20,"ingredients":["eidam","vejce","hladká mouka","strouhanka","hranolky","tatarka"]},{"name":"Ovocné knedlíky","minutes":50,"tags":["sladke","bezmasa"],"last":45,"ingredients":["tvaroh","hrubá mouka","vejce","borůvky","máslo","cukr"]},{"name":"Vepřo knedlo zelo","minutes":120,"tags":["vikend","maso"],"last":38,"ingredients":["vepřová plec","kysané zelí","cibule","kmín","houskový knedlík"]},{"name":"Krupicová kaše","minutes":15,"tags":["sladke","bezmasa","rychle"],"last":11,"ingredients":["krupice","mléko","máslo","cukr","kakao"]}]'::jsonb;
  shop jsonb := '["banány","bílé jogurty","rohlíky"]'::jsonb;
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
