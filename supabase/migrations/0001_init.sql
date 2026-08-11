-- Babyshower wishlist — schema inicial
-- Los invitados solo leen `gifts` y reservan vía RPC atómica.
-- Los datos de quién reserva viven en `claims`, sin acceso público.

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  url text,
  image_url text,
  price_hint text,
  category text not null default 'Otros',
  priority int not null default 0,
  claimed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts(id) on delete cascade,
  claimer_name text,
  message text,
  created_at timestamptz not null default now()
);

create table public.admin_config (
  id int primary key default 1 check (id = 1),
  passphrase text not null
);

alter table public.gifts enable row level security;
alter table public.claims enable row level security;
alter table public.admin_config enable row level security;

-- Invitados: solo lectura de regalos (sin datos personales)
create policy "gifts_public_read" on public.gifts
  for select using (true);

-- claims y admin_config: sin políticas => sin acceso directo desde el cliente

-- Realtime para que la lista se actualice en vivo
alter publication supabase_realtime add table public.gifts;

-- == Helpers ==

create or replace function public._is_admin(p_pass text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from admin_config where passphrase = p_pass);
$$;

-- == RPC invitados ==

-- Reserva atómica: solo triunfa si nadie lo cogió antes.
create or replace function public.claim_gift(p_gift_id uuid, p_name text default null, p_message text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update gifts set claimed = true
  where id = p_gift_id and claimed = false;
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    return false;
  end if;

  insert into claims (gift_id, claimer_name, message)
  values (p_gift_id, nullif(trim(coalesce(p_name, '')), ''), nullif(trim(coalesce(p_message, '')), ''));

  return true;
end;
$$;

-- == RPC admin (todas exigen passphrase) ==

create or replace function public.admin_login(p_pass text)
returns boolean
language sql security definer set search_path = public
as $$ select _is_admin(p_pass); $$;

create or replace function public.admin_list_claims(p_pass text)
returns table (gift_id uuid, gift_name text, claimer_name text, message text, claimed_at timestamptz)
language plpgsql security definer set search_path = public
as $$
begin
  if not _is_admin(p_pass) then raise exception 'unauthorized'; end if;
  return query
    select c.gift_id, g.name, c.claimer_name, c.message, c.created_at
    from claims c join gifts g on g.id = c.gift_id
    order by c.created_at desc;
end;
$$;

create or replace function public.admin_add_gift(
  p_pass text, p_name text, p_description text default null, p_url text default null,
  p_image_url text default null, p_price_hint text default null,
  p_category text default 'Otros', p_priority int default 0
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if not _is_admin(p_pass) then raise exception 'unauthorized'; end if;
  insert into gifts (name, description, url, image_url, price_hint, category, priority)
  values (p_name, p_description, p_url, p_image_url, p_price_hint, coalesce(p_category, 'Otros'), coalesce(p_priority, 0))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.admin_update_gift(
  p_pass text, p_gift_id uuid, p_name text, p_description text, p_url text,
  p_image_url text, p_price_hint text, p_category text, p_priority int
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not _is_admin(p_pass) then raise exception 'unauthorized'; end if;
  update gifts set
    name = p_name, description = p_description, url = p_url,
    image_url = p_image_url, price_hint = p_price_hint,
    category = coalesce(p_category, 'Otros'), priority = coalesce(p_priority, 0)
  where id = p_gift_id;
end;
$$;

create or replace function public.admin_delete_gift(p_pass text, p_gift_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not _is_admin(p_pass) then raise exception 'unauthorized'; end if;
  delete from gifts where id = p_gift_id;
end;
$$;

-- Libera un regalo (borra sus reservas y lo vuelve a poner disponible)
create or replace function public.admin_unclaim_gift(p_pass text, p_gift_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not _is_admin(p_pass) then raise exception 'unauthorized'; end if;
  delete from claims where gift_id = p_gift_id;
  update gifts set claimed = false where id = p_gift_id;
end;
$$;

-- Los RPC se ejecutan como anon: conceder explícitamente
grant execute on function public.claim_gift(uuid, text, text) to anon;
grant execute on function public.admin_login(text) to anon;
grant execute on function public.admin_list_claims(text) to anon;
grant execute on function public.admin_add_gift(text, text, text, text, text, text, text, int) to anon;
grant execute on function public.admin_update_gift(text, uuid, text, text, text, text, text, text, int) to anon;
grant execute on function public.admin_delete_gift(text, uuid) to anon;
grant execute on function public.admin_unclaim_gift(text, uuid) to anon;
revoke execute on function public._is_admin(text) from anon;
