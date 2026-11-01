create extension if not exists pgcrypto;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists locations_name_key
  on public.locations (lower(name));

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  language text not null,
  genre text not null,
  duration text not null,
  poster_url text not null default '',
  description text,
  trailer_url text,
  created_at timestamptz not null default now()
);

alter table public.movies
  add column if not exists trailer_url text;

create table if not exists public.theatres (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  location_id uuid references public.locations (id) on delete restrict,
  total_seats integer not null check (total_seats > 0),
  created_at timestamptz not null default now()
);

alter table public.theatres
  add column if not exists location_id uuid;

insert into public.locations (name, is_active)
select distinct initcap(btrim(split_part(t.location, ',', 1))), true
from public.theatres t
where btrim(t.location) <> ''
  and btrim(split_part(t.location, ',', 1)) <> ''
on conflict do nothing;

insert into public.locations (name, is_active)
select 'Kavali', true
where not exists (select 1 from public.locations);

update public.theatres t
set location_id = l.id
from public.locations l
where t.location_id is null
  and lower(l.name) = lower(initcap(btrim(split_part(t.location, ',', 1))));

update public.theatres t
set location_id = (
  select l.id
  from public.locations l
  order by l.created_at asc, l.name asc
  limit 1
)
where t.location_id is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.theatres'::regclass
      and conname = 'theatres_location_id_fkey'
  ) then
    alter table public.theatres
      add constraint theatres_location_id_fkey
      foreign key (location_id)
      references public.locations (id)
      on delete restrict;
  end if;
end $$;

alter table public.theatres
  alter column location_id set not null;

create index if not exists theatres_location_id_idx
  on public.theatres (location_id);

create table if not exists public.shows (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies (id) on delete cascade,
  theatre_id uuid not null references public.theatres (id) on delete cascade,
  show_date date not null,
  show_time time not null,
  price numeric(10, 2) not null check (price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists shows_movie_id_idx on public.shows (movie_id);
create index if not exists shows_theatre_id_idx on public.shows (theatre_id);
create index if not exists shows_date_time_idx on public.shows (show_date, show_time);

alter table public.movies enable row level security;
alter table public.theatres enable row level security;
alter table public.shows enable row level security;
alter table public.locations enable row level security;

drop policy if exists "Active locations are publicly readable" on public.locations;
create policy "Active locations are publicly readable"
  on public.locations
  for select
  to anon
  using (is_active = true);

drop policy if exists "Authenticated users can read locations" on public.locations;
create policy "Authenticated users can read locations"
  on public.locations
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can manage locations" on public.locations;
create policy "Authenticated users can manage locations"
  on public.locations
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Movies are publicly readable" on public.movies;
create policy "Movies are publicly readable"
  on public.movies
  for select
  using (true);

drop policy if exists "Authenticated users can manage movies" on public.movies;
create policy "Authenticated users can manage movies"
  on public.movies
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Theatres are publicly readable" on public.theatres;
create policy "Theatres are publicly readable"
  on public.theatres
  for select
  using (true);

drop policy if exists "Authenticated users can manage theatres" on public.theatres;
create policy "Authenticated users can manage theatres"
  on public.theatres
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Shows are publicly readable" on public.shows;
create policy "Shows are publicly readable"
  on public.shows
  for select
  using (true);

drop policy if exists "Authenticated users can manage shows" on public.shows;
create policy "Authenticated users can manage shows"
  on public.shows
  for all
  to authenticated
  using (true)
  with check (true);

grant select on table public.locations to anon, authenticated;
grant insert, update, delete on table public.locations to authenticated;

grant select on table public.movies to anon, authenticated;
grant insert, update, delete on table public.movies to authenticated;

grant select on table public.theatres to anon, authenticated;
grant insert, update, delete on table public.theatres to authenticated;

grant select on table public.shows to anon, authenticated;
grant insert, update, delete on table public.shows to authenticated;
