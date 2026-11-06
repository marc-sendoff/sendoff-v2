-- Watched sends (Plus): a third status on user_trips plus the columns the
-- hourly fare-alerts job needs. Safe to run more than once.
alter table public.user_trips drop constraint if exists user_trips_status_check;
alter table public.user_trips add constraint user_trips_status_check check (status in ('saved', 'done', 'watching'));
alter table public.user_trips
  add column if not exists origin        text,         -- IATA of the home base when watched, e.g. MIA
  add column if not exists base_price    integer,      -- the fare the drop is measured against
  add column if not exists last_price    integer,      -- last fare the job saw
  add column if not exists last_alert_at timestamptz;  -- throttle: one email per route per ~20h
