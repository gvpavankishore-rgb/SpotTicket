create extension if not exists pgcrypto;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists locations_name_key
  on public.locations (lower(name));

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

grant select on table public.locations to anon, authenticated;
grant insert, update, delete on table public.locations to authenticated;
