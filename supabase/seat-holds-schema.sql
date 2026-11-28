-- Temporary seat holds for SpotTicket booking flow
create extension if not exists pgcrypto;

create table if not exists public.seat_holds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  show_id uuid not null references public.shows (id) on delete cascade,
  seats text[] not null check (cardinality(seats) > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists seat_holds_show_expires_idx on public.seat_holds (show_id, expires_at);
create index if not exists seat_holds_user_idx on public.seat_holds (user_id);

create table if not exists public.seat_hold_seats (
  id uuid primary key default gen_random_uuid(),
  hold_id uuid not null references public.seat_holds (id) on delete cascade,
  show_id uuid not null references public.shows (id) on delete cascade,
  seat_number text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists seat_hold_seats_show_idx on public.seat_hold_seats (show_id, expires_at);

delete from public.seat_hold_seats hs
where hs.expires_at <= now()
   or exists (
     select 1 from public.booked_seats bs
     where bs.show_id = hs.show_id and bs.seat_number = hs.seat_number
   );

delete from public.seat_hold_seats a using public.seat_hold_seats b
where a.show_id = b.show_id and a.seat_number = b.seat_number
  and (a.expires_at < b.expires_at or (a.expires_at = b.expires_at and a.ctid < b.ctid));

create unique index if not exists seat_hold_seats_active_show_seat_idx
  on public.seat_hold_seats (show_id, seat_number);

alter table public.seat_holds enable row level security;
alter table public.seat_hold_seats enable row level security;

drop policy if exists "Users can read their own holds" on public.seat_holds;
create policy "Users can read their own holds" on public.seat_holds
  for select to authenticated using (auth.uid() = user_id);

revoke all on table public.seat_holds from anon, authenticated;
revoke all on table public.seat_hold_seats from anon, authenticated;
grant select, insert, update, delete on table public.seat_holds to service_role;
grant select, insert, update, delete on table public.seat_hold_seats to service_role;

create or replace function public.cleanup_expired_seat_holds()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.seat_hold_seats where expires_at <= now();
  delete from public.seat_holds where expires_at <= now();
$$;

create or replace function public.get_unavailable_seats(p_show_id uuid)
returns text[]
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(array_agg(distinct s.seat), '{}'::text[])
  from (
    select upper(btrim(seat_number)) as seat
    from public.booked_seats
    where show_id = p_show_id
    union
    select upper(btrim(booked_seat.seat)) as seat
    from public.bookings b
    cross join lateral unnest(b.seats) as booked_seat(seat)
    where b.show_id = p_show_id and b.status = 'confirmed'
    union
    select upper(btrim(seat_number)) as seat
    from public.seat_hold_seats
    where show_id = p_show_id and expires_at > now()
  ) as s;
$$;

drop function if exists public.create_seat_hold(uuid, uuid, text[], integer);
create or replace function public.create_seat_hold(
  p_user_id uuid,
  p_show_id uuid,
  p_seats text[],
  p_hold_minutes integer default 8
)
returns table(hold_id uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seats text[];
  v_conflict text;
  v_hold_id uuid;
  v_expires_at timestamptz;
  v_minutes integer := greatest(1, least(coalesce(p_hold_minutes, 8), 15));
begin
  if p_user_id is null or p_show_id is null or p_seats is null or cardinality(p_seats) = 0 then
    raise exception 'INVALID_HOLD_DETAILS' using errcode = '22023';
  end if;

  select array_agg(normalized.seat order by normalized.seat)
  into v_seats
  from (
    select distinct upper(btrim(s.seat)) as seat
    from unnest(p_seats) as s(seat)
    where btrim(s.seat) <> ''
  ) as normalized;

  if v_seats is null or cardinality(v_seats) = 0 or cardinality(v_seats) > 10 then
    raise exception 'INVALID_HOLD_DETAILS' using errcode = '22023';
  end if;

  perform public.cleanup_expired_seat_holds();
  perform pg_advisory_xact_lock(hashtextextended(p_show_id::text, 0));

  select s.seat into v_conflict
  from unnest(public.get_unavailable_seats(p_show_id)) as s(seat)
  where s.seat = any(v_seats)
    and not exists (
      select 1 from public.seat_hold_seats hs
      join public.seat_holds h on h.id = hs.hold_id
      where h.user_id = p_user_id and hs.show_id = p_show_id and hs.seat_number = s.seat and hs.expires_at > now()
    )
  limit 1;

  if v_conflict is not null then
    raise exception 'SEAT_UNAVAILABLE:%', v_conflict using errcode = 'P0001';
  end if;

  delete from public.seat_hold_seats hs
  using public.seat_holds h
  where hs.hold_id = h.id and h.user_id = p_user_id and h.show_id = p_show_id;

  delete from public.seat_holds h
  where h.user_id = p_user_id and h.show_id = p_show_id;

  v_expires_at := now() + make_interval(mins => v_minutes);

  insert into public.seat_holds (user_id, show_id, seats, expires_at)
  values (p_user_id, p_show_id, v_seats, v_expires_at)
  returning id into v_hold_id;

  insert into public.seat_hold_seats (hold_id, show_id, seat_number, expires_at)
  select v_hold_id, p_show_id, s.seat, v_expires_at
  from unnest(v_seats) as s(seat);

  return query select v_hold_id, v_expires_at;
end;
$$;

drop function if exists public.release_seat_hold(uuid, uuid);
create or replace function public.release_seat_hold(p_user_id uuid, p_hold_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.seat_holds where id = p_hold_id and user_id = p_user_id;
end;
$$;

drop function if exists public.get_active_seat_hold(uuid, uuid);
create or replace function public.get_active_seat_hold(p_user_id uuid, p_show_id uuid)
returns table(hold_id uuid, seats text[], expires_at timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select h.id, h.seats, h.expires_at
  from public.seat_holds h
  where h.user_id = p_user_id and h.show_id = p_show_id and h.expires_at > now()
  order by h.expires_at desc
  limit 1;
$$;

revoke all on function public.cleanup_expired_seat_holds() from public;
revoke all on function public.get_unavailable_seats(uuid) from public;
revoke all on function public.create_seat_hold(uuid, uuid, text[], integer) from public;
revoke all on function public.release_seat_hold(uuid, uuid) from public;
revoke all on function public.get_active_seat_hold(uuid, uuid) from public;

grant execute on function public.get_unavailable_seats(uuid) to anon, authenticated, service_role;
grant execute on function public.create_seat_hold(uuid, uuid, text[], integer) to service_role;
grant execute on function public.release_seat_hold(uuid, uuid) to service_role;
grant execute on function public.get_active_seat_hold(uuid, uuid) to service_role;
grant execute on function public.cleanup_expired_seat_holds() to service_role;
