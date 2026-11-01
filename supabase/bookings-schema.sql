create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  show_id uuid not null references public.shows (id) on delete cascade,
  seats text[] not null check (cardinality(seats) > 0),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  payment_id text not null unique,
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'cancelled', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_user_id_idx on public.bookings (user_id);
create index if not exists bookings_show_id_idx on public.bookings (show_id);
create index if not exists bookings_show_status_idx
  on public.bookings (show_id, status);

create table if not exists public.booked_seats (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  show_id uuid not null references public.shows (id) on delete cascade,
  seat_number text not null,
  created_at timestamptz not null default now()
);

create index if not exists booked_seats_booking_id_idx
  on public.booked_seats (booking_id);
create index if not exists booked_seats_show_id_idx
  on public.booked_seats (show_id);

insert into public.booked_seats (booking_id, show_id, seat_number)
select distinct on (b.show_id, upper(btrim(booked_seat.seat)))
  b.id,
  b.show_id,
  upper(btrim(booked_seat.seat))
from public.bookings b
cross join lateral unnest(b.seats) as booked_seat(seat)
where b.status = 'confirmed'
  and btrim(booked_seat.seat) <> ''
order by
  b.show_id,
  upper(btrim(booked_seat.seat)),
  b.created_at asc,
  b.id
on conflict do nothing;

delete from public.booked_seats duplicate
using public.booked_seats keeper
where duplicate.show_id = keeper.show_id
  and duplicate.seat_number = keeper.seat_number
  and duplicate.ctid < keeper.ctid;

create unique index if not exists booked_seats_show_id_seat_number_key
  on public.booked_seats (show_id, seat_number);

create or replace function public.get_booked_seats(p_show_id uuid)
returns text[]
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(array_agg(distinct booked.seat), '{}'::text[])
  from (
    select upper(btrim(seat_number)) as seat
    from public.booked_seats
    where show_id = p_show_id
    union
    select upper(btrim(booked_seat.seat)) as seat
    from public.bookings b
    cross join lateral unnest(b.seats) as booked_seat(seat)
    where b.show_id = p_show_id
      and b.status = 'confirmed'
  ) as booked;
$$;

create or replace function public.confirm_booking(
  p_user_id uuid,
  p_show_id uuid,
  p_seats text[],
  p_total_amount numeric,
  p_payment_id text
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

  select b.id
  into v_existing_booking_id
  from public.bookings b
  where b.payment_id = p_payment_id
    and b.user_id = p_user_id;

  if v_existing_booking_id is not null then
    return v_existing_booking_id;
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
    payment_id,
    status
  )
  values (
    p_user_id,
    p_show_id,
    v_seats,
    p_total_amount,
    p_payment_id,
    'confirmed'
  )
  returning id into v_booking_id;

  insert into public.booked_seats (booking_id, show_id, seat_number)
  select v_booking_id, p_show_id, s.seat
  from unnest(v_seats) as s(seat);

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

revoke all on function public.get_booked_seats(uuid) from public;
grant execute on function public.get_booked_seats(uuid) to anon, authenticated;

revoke all on function public.confirm_booking(uuid, uuid, text[], numeric, text)
  from public;
grant execute
  on function public.confirm_booking(uuid, uuid, text[], numeric, text)
  to service_role;

alter table public.bookings enable row level security;
alter table public.booked_seats enable row level security;

drop policy if exists "Users can read their own bookings" on public.bookings;
create policy "Users can read their own bookings"
  on public.bookings
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own bookings" on public.bookings;

revoke insert on table public.bookings from anon, authenticated;
grant select on table public.bookings to authenticated;
grant select, insert on table public.bookings to service_role;

revoke all on table public.booked_seats from anon, authenticated;
grant select, insert, update, delete on table public.booked_seats to service_role;
