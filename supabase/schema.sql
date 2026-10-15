-- Sendoff accounts. Run once in Supabase → SQL editor. Safe to re-run.
--
-- Two tables the browser can touch (its own rows only, enforced by RLS) and
-- one it can only read: membership is written by the Netlify functions with
-- the secret key, never by the client, so a visitor cannot grant themselves
-- Plus by editing a request.

create extension if not exists pgcrypto;

-- ---------- profiles: one row per account, editable by its owner ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  name        text,
  city        text,
  budget      integer,
  crew        integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles: owner reads" on public.profiles;
create policy "profiles: owner reads" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles: owner updates" on public.profiles;
create policy "profiles: owner updates" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- A profile row appears the moment an account does.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- trips: saved and done, with what it cost ----------
create table if not exists public.user_trips (
  user_id     uuid not null references auth.users(id) on delete cascade,
  trip_id     text not null,
  status      text not null check (status in ('saved', 'done')),
  spent       integer,                       -- dollars, optional, per person
  done_at     date,
  created_at  timestamptz not null default now(),
  primary key (user_id, trip_id)
);
alter table public.user_trips enable row level security;
drop policy if exists "trips: owner all" on public.user_trips;
create policy "trips: owner all" on public.user_trips for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- memberships: read by the owner, written only by the server ----------
create table if not exists public.memberships (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  plan                  text not null default 'free' check (plan in ('free', 'plus', 'founder')),
  source                text,                -- 'stripe' | 'code' | 'comp'
  interval              text,                -- 'month' | 'year' | null
  current_period_end    timestamptz,         -- null = does not expire (code/comp)
  cancel_at_period_end  boolean not null default false,
  stripe_customer_id    text,
  stripe_subscription_id text,
  founder_number        integer,             -- 1..10, Founders Club seat
  updated_at            timestamptz not null default now()
);
alter table public.memberships enable row level security;
drop policy if exists "memberships: owner reads" on public.memberships;
create policy "memberships: owner reads" on public.memberships for select using (auth.uid() = user_id);
-- no insert/update policies on purpose: only the secret key (service role) writes here

create index if not exists memberships_customer_idx on public.memberships (stripe_customer_id);
