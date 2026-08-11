-- Regalos "ilimitados": nunca se agotan (ej. pañales — cada invitado aporta
-- un paquete). Se lleva un contador público de aportaciones, sin datos personales.

alter table public.gifts add column unlimited boolean not null default false;
alter table public.gifts add column claims_count int not null default 0;

create or replace function public.claim_gift(p_gift_id uuid, p_name text default null, p_message text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  -- ilimitado: siempre acepta; normal: solo si nadie lo cogió antes
  update gifts set
    claimed = claimed or not unlimited,
    claims_count = claims_count + 1
  where id = p_gift_id and (unlimited or not claimed);
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    return false;
  end if;

  insert into claims (gift_id, claimer_name, message)
  values (p_gift_id, nullif(trim(coalesce(p_name, '')), ''), nullif(trim(coalesce(p_message, '')), ''));

  return true;
end;
$$;

-- Firmas nuevas con p_unlimited: reemplazan a las anteriores
drop function public.admin_add_gift(text, text, text, text, text, text, text, int);
drop function public.admin_update_gift(text, uuid, text, text, text, text, text, text, int);

create or replace function public.admin_add_gift(
  p_pass text, p_name text, p_description text default null, p_url text default null,
  p_image_url text default null, p_price_hint text default null,
  p_category text default 'Otros', p_priority int default 0, p_unlimited boolean default false
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if not _is_admin(p_pass) then raise exception 'unauthorized'; end if;
  insert into gifts (name, description, url, image_url, price_hint, category, priority, unlimited)
  values (p_name, p_description, p_url, p_image_url, p_price_hint, coalesce(p_category, 'Otros'), coalesce(p_priority, 0), coalesce(p_unlimited, false))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.admin_update_gift(
  p_pass text, p_gift_id uuid, p_name text, p_description text, p_url text,
  p_image_url text, p_price_hint text, p_category text, p_priority int, p_unlimited boolean default false
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not _is_admin(p_pass) then raise exception 'unauthorized'; end if;
  update gifts set
    name = p_name, description = p_description, url = p_url,
    image_url = p_image_url, price_hint = p_price_hint,
    category = coalesce(p_category, 'Otros'), priority = coalesce(p_priority, 0),
    unlimited = coalesce(p_unlimited, false),
    claimed = case when coalesce(p_unlimited, false) then false else claimed end
  where id = p_gift_id;
end;
$$;

grant execute on function public.admin_add_gift(text, text, text, text, text, text, text, int, boolean) to anon;
grant execute on function public.admin_update_gift(text, uuid, text, text, text, text, text, text, int, boolean) to anon;
