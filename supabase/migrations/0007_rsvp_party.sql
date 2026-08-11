-- RSVP: en lugar de un número, "voy solo / con pareja / con niños…"

alter table public.rsvps drop column party_size;
alter table public.rsvps add column party text;

drop function public.submit_rsvp(text, boolean, int, text, text, text);
drop function public.admin_list_rsvps(text);

create or replace function public.submit_rsvp(
  p_name text,
  p_attending boolean default true,
  p_party text default null,
  p_drinks text default null,
  p_allergies text default null,
  p_message text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'name_required';
  end if;

  insert into rsvps (name, attending, party, drinks, allergies, message)
  values (
    left(trim(p_name), 120),
    coalesce(p_attending, true),
    nullif(left(trim(coalesce(p_party, '')), 120), ''),
    nullif(left(trim(coalesce(p_drinks, '')), 300), ''),
    nullif(left(trim(coalesce(p_allergies, '')), 300), ''),
    nullif(left(trim(coalesce(p_message, '')), 400), '')
  );
  return true;
end;
$$;

create or replace function public.admin_list_rsvps(p_pass text)
returns table (name text, attending boolean, party text, drinks text, allergies text, message text, created_at timestamptz)
language plpgsql security definer set search_path = public
as $$
begin
  if not _is_admin(p_pass) then raise exception 'unauthorized'; end if;
  return query
    select r.name, r.attending, r.party, r.drinks, r.allergies, r.message, r.created_at
    from rsvps r
    order by r.created_at desc;
end;
$$;

grant execute on function public.submit_rsvp(text, boolean, text, text, text, text) to anon;
grant execute on function public.admin_list_rsvps(text) to anon;
