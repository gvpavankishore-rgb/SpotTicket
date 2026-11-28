-- 3D movies + glass charges
alter table public.movies
  add column if not exists is_3d boolean not null default false;

alter table public.movies
  add column if not exists glass_charge numeric(10, 2) not null default 0
  check (glass_charge >= 0);

alter table public.bookings
  add column if not exists glass_quantity integer not null default 0
  check (glass_quantity >= 0);

alter table public.bookings
  add column if not exists glass_total numeric(10, 2) not null default 0
  check (glass_total >= 0);

-- Recreate confirm_booking to include 3D glass charges derived from the movie.
drop function if exists public.confirm_booking(uuid, uuid, text[], numeric, text, jsonb);

create or replace function public.confirm_booking(
  p_user_id uuid,
  p_show_id uuid,
  p_seats text[],
  p_total_amount numeric,
  p_payment_id text,
  p_items jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid;
  v_existing_booking_id uuid;
  v_conflict_seat text;
  v_seats text[];
  v_item jsonb;
  v_snack_id uuid;
  v_name text;
  v_unit_price numeric;
  v_quantity integer;
  v_line_total numeric;
  v_show_price numeric(10, 2);
  v_is_3d boolean;
  v_glass_charge numeric(10, 2);
  v_glass_quantity integer;
  v_glass_total numeric(10, 2);
  v_seat_total numeric(10, 2);
  v_snack_total numeric(10, 2) := 0;
  v_expected_total numeric(10, 2);
begin
  if p_user_id is null
    or p_show_id is null
    or p_payment_id is null
    or btrim(p_payment_id) = ''
    or p_seats is null
    or cardinality(p_seats) = 0
    or p_total_amount is null
    or p_total_amount < 0 then
    raise exception 'INVALID_BOOKING_DETAILS' using errcode = '22023';
  end if;

  select array_agg(normalized.seat order by normalized.seat)
  into v_seats
  from (
    select distinct upper(btrim(s.seat)) as seat
    from unnest(p_seats) as s(seat)
    where btrim(s.seat) <> ''
  ) as normalized;

  if v_seats is null
    or cardinality(v_seats) = 0
    or cardinality(v_seats) > 10 then
    raise exception 'INVALID_BOOKING_DETAILS' using errcode = '22023';
  end if;

  if p_items is null then
    p_items := '[]'::jsonb;
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 20 then
    raise exception 'INVALID_BOOKING_ITEMS' using errcode = '22023';
  end if;

  select b.id
  into v_existing_booking_id
  from public.bookings b
  where b.payment_id = p_payment_id
    and b.user_id = p_user_id;

  if v_existing_booking_id is not null then
    return v_existing_booking_id;
  end if;

  select s.price, coalesce(m.is_3d, false), coalesce(m.glass_charge, 0)
  into v_show_price, v_is_3d, v_glass_charge
  from public.shows s
  join public.movies m on m.id = s.movie_id
  where s.id = p_show_id;

  if v_show_price is null then
    raise exception 'INVALID_BOOKING_DETAILS' using errcode = '22023';
  end if;

  v_glass_quantity := case when v_is_3d then cardinality(v_seats) else 0 end;
  v_glass_total := round((v_glass_quantity * greatest(v_glass_charge, 0))::numeric, 2);
  v_seat_total := round((v_show_price * cardinality(v_seats))::numeric, 2);

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_name := btrim(coalesce(v_item->>'name', ''));
    v_unit_price := nullif(v_item->>'unit_price', '')::numeric;
    v_quantity := nullif(v_item->>'quantity', '')::integer;
    v_line_total := nullif(v_item->>'line_total', '')::numeric;

    if v_name = ''
      or v_unit_price is null
      or v_unit_price < 0
      or v_quantity is null
      or v_quantity < 1
      or v_quantity > 20
      or v_line_total is null
      or abs(v_line_total - round((v_unit_price * v_quantity)::numeric, 2)) > 0.01 then
      raise exception 'INVALID_BOOKING_ITEMS' using errcode = '22023';
    end if;

    v_snack_total := round((v_snack_total + v_line_total)::numeric, 2);
  end loop;

  v_expected_total := round((v_seat_total + v_glass_total + v_snack_total)::numeric, 2);
  if abs(round(p_total_amount::numeric, 2) - v_expected_total) > 0.01 then
    raise exception 'INVALID_BOOKING_TOTAL' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_show_id::text, 0));

  select booked.seat
  into v_conflict_seat
  from unnest(public.get_booked_seats(p_show_id)) as booked(seat)
  where booked.seat = any(v_seats)
  limit 1;

  if v_conflict_seat is not null then
    raise exception 'SEAT_UNAVAILABLE:%', v_conflict_seat using errcode = 'P0001';
  end if;

  insert into public.bookings (
    user_id,
    show_id,
    seats,
    total_amount,
    glass_quantity,
    glass_total,
    payment_id,
    status
  )
  values (
    p_user_id,
    p_show_id,
    v_seats,
    v_expected_total,
    v_glass_quantity,
    v_glass_total,
    p_payment_id,
    'confirmed'
  )
  returning id into v_booking_id;

  insert into public.booked_seats (booking_id, show_id, seat_number)
  select v_booking_id, p_show_id, s.seat
  from unnest(v_seats) as s(seat);

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_name := btrim(coalesce(v_item->>'name', ''));
    v_snack_id := nullif(v_item->>'snack_id', '')::uuid;
    v_unit_price := nullif(v_item->>'unit_price', '')::numeric;
    v_quantity := nullif(v_item->>'quantity', '')::integer;
    v_line_total := nullif(v_item->>'line_total', '')::numeric;

    insert into public.booking_items (
      booking_id,
      snack_id,
      name,
      unit_price,
      quantity,
      line_total
    )
    values (
      v_booking_id,
      v_snack_id,
      v_name,
      v_unit_price,
      v_quantity,
      v_line_total
    );
  end loop;

  return v_booking_id;
exception
  when unique_violation then
    select b.id
    into v_existing_booking_id
    from public.bookings b
    where b.payment_id = p_payment_id
      and b.user_id = p_user_id;

    if v_existing_booking_id is not null then
      return v_existing_booking_id;
    end if;

    raise exception 'SEAT_UNAVAILABLE' using errcode = 'P0001';
end;
$$;

revoke all on function public.confirm_booking(uuid, uuid, text[], numeric, text, jsonb) from public;
grant execute on function public.confirm_booking(uuid, uuid, text[], numeric, text, jsonb) to service_role;
