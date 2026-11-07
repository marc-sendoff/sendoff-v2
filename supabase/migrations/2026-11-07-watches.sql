-- Watched sends get their own table so a trip can be done AND watched. The
-- 'watching' status on user_trips (2026-11-06) is retired; rows with it are
-- moved over, then the old check goes back to saved/done.
create table if not exists public.watches (
  user_id       uuid not null references auth.users(id) on delete cascade,
  trip_id       text not null,
  origin        text,            -- IATA of the home base when watched, e.g. MIA
  base_price    integer,         -- fare the drop is measured against
  last_price    integer,         -- last fare the alerts job saw
  last_alert_at timestamptz,     -- throttle: one email per route per ~20h
  created_at    timestamptz not null default now(),
  primary key (user_id, trip_id)
);
alter table public.watches enable row level security;
drop policy if exists "watches: owner all" on public.watches;
create policy "watches: owner all" on public.watches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
insert into public.watches (user_id, trip_id, origin, base_price, last_price, last_alert_at)
  select user_id, trip_id, origin, base_price, last_price, last_alert_at from public.user_trips where status = 'watching'
  on conflict do nothing;
delete from public.user_trips where status = 'watching';
alter table public.user_trips drop constraint if exists user_trips_status_check;
alter table public.user_trips add constraint user_trips_status_check check (status in ('saved', 'done'));
