create extension if not exists pgcrypto;

create table if not exists public.movie_cast (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies (id) on delete cascade,
  name text not null,
  role text not null check (role in ('Director', 'Actor', 'Producer')),
  photo_url text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists movie_cast_movie_id_idx
  on public.movie_cast (movie_id, sort_order);

alter table public.movie_cast enable row level security;

drop policy if exists "Cast is publicly readable" on public.movie_cast;
create policy "Cast is publicly readable"
  on public.movie_cast
  for select
  using (true);

drop policy if exists "Authenticated users can manage cast" on public.movie_cast;
create policy "Authenticated users can manage cast"
  on public.movie_cast
  for all
  to authenticated
  using (true)
  with check (true);

grant select on table public.movie_cast to anon, authenticated;
grant insert, update, delete on table public.movie_cast to authenticated;
