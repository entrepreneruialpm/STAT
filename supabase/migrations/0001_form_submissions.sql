-- Form submissions for savetheashtree.com
-- Public visitors (the anon key used by the website) may INSERT only.
-- Nobody on the public web can read submissions. Read them in the Supabase dashboard
-- or with a signed-in staff account (see the README).

create extension if not exists pgcrypto;

-- Quote / injection estimate requests (About page)
create table if not exists public.quote_requests (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  name                  text not null check (char_length(name) between 1 and 200),
  email                 text not null check (char_length(email) between 3 and 254 and email like '%_@_%'),
  phone                 text check (char_length(phone) <= 40),
  property_address      text check (char_length(property_address) <= 300),
  tree_type             text not null check (char_length(tree_type) between 1 and 100),
  tree_count            integer check (tree_count between 1 and 500),
  trunk_circumference   text check (char_length(trunk_circumference) <= 40),
  notes                 text check (char_length(notes) <= 2000),
  source_page           text check (char_length(source_page) <= 200),
  handled               boolean not null default false
);

-- Townhall sign-ups (EAB Townhalls page)
create table if not exists public.townhall_signups (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null check (char_length(name) between 1 and 200),
  email        text not null check (char_length(email) between 3 and 254 and email like '%_@_%'),
  phone        text check (char_length(phone) <= 40),
  source_page  text check (char_length(source_page) <= 200),
  handled      boolean not null default false
);

-- Row Level Security: anon can insert, nothing else.
alter table public.quote_requests   enable row level security;
alter table public.townhall_signups enable row level security;

drop policy if exists "public can submit quotes" on public.quote_requests;
create policy "public can submit quotes"
  on public.quote_requests for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public can sign up for townhalls" on public.townhall_signups;
create policy "public can sign up for townhalls"
  on public.townhall_signups for insert
  to anon, authenticated
  with check (true);

-- Belt and braces: remove any default read or update rights from the public roles.
revoke all on public.quote_requests   from anon, authenticated;
revoke all on public.townhall_signups from anon, authenticated;
grant insert on public.quote_requests   to anon, authenticated;
grant insert on public.townhall_signups to anon, authenticated;
