-- Confirmación de asistencia (RSVP) con preferencias de bebida y alérgenos.
-- Los invitados solo pueden ENVIAR (RPC); leer, solo el admin.

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  attending boolean not null default true,
  party_size int not null default 1 check (party_size between 1 and 15),
  drinks text,
  allergies text,
  message text,
  created_at timestamptz not null default now()
);

alter table public.rsvps enable row level security;
-- sin políticas => sin acceso directo desde el cliente

create or replace function public.submit_rsvp(
  p_name text,
  p_attending boolean default true,
  p_party_size int default 1,
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

  insert into rsvps (name, attending, party_size, drinks, allergies, message)
  values (
    left(trim(p_name), 120),
    coalesce(p_attending, true),
    least(greatest(coalesce(p_party_size, 1), 1), 15),
    nullif(left(trim(coalesce(p_drinks, '')), 300), ''),
    nullif(left(trim(coalesce(p_allergies, '')), 300), ''),
    nullif(left(trim(coalesce(p_message, '')), 400), '')
  );
  return true;
end;
$$;

create or replace function public.admin_list_rsvps(p_pass text)
returns table (name text, attending boolean, party_size int, drinks text, allergies text, message text, created_at timestamptz)
language plpgsql security definer set search_path = public
as $$
begin
  if not _is_admin(p_pass) then raise exception 'unauthorized'; end if;
  return query
    select r.name, r.attending, r.party_size, r.drinks, r.allergies, r.message, r.created_at
    from rsvps r
    order by r.created_at desc;
end;
$$;

grant execute on function public.submit_rsvp(text, boolean, int, text, text, text) to anon;
grant execute on function public.admin_list_rsvps(text) to anon;
