alter table public.movies
  add column if not exists trailer_url text;
