-- Social: plan a send, invite the crew by link, chat per send.
-- Public invite pages and RSVPs go through Netlify functions (service role);
-- RLS below covers signed-in members in the app.

create table if not exists public.sends (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                      -- short link: sendofftrips.com/s/<code>
  owner uuid not null references auth.users(id) on delete cascade,
  trip_id text not null,
  origin text,
  date_out date,
  date_back date,
  headcount integer not null default 2,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.send_members (
  id uuid primary key default gen_random_uuid(),
  send_id uuid not null references public.sends(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  contact text,                                   -- email or phone, for nudges
  token text not null unique,                     -- lets a no-login friend edit their own RSVP + chat
  status text not null default 'invited' check (status in ('invited','in','out','maybe')),
  created_at timestamptz not null default now()
);
create index if not exists send_members_send_idx on public.send_members(send_id);

create table if not exists public.send_messages (
  id uuid primary key default gen_random_uuid(),
  send_id uuid not null references public.sends(id) on delete cascade,
  member_id uuid references public.send_members(id) on delete set null,
  name text not null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists send_messages_send_idx on public.send_messages(send_id, created_at);

alter table public.sends enable row level security;
alter table public.send_members enable row level security;
alter table public.send_messages enable row level security;

-- the owner sees and edits their own sends
create policy "sends: owner all" on public.sends for all using (auth.uid() = owner) with check (auth.uid() = owner);
-- signed-in members can read sends they're on
create policy "sends: member read" on public.sends for select using (exists (select 1 from public.send_members m where m.send_id = sends.id and m.user_id = auth.uid()));
create policy "members: owner all" on public.send_members for all using (exists (select 1 from public.sends s where s.id = send_members.send_id and s.owner = auth.uid())) with check (exists (select 1 from public.sends s where s.id = send_members.send_id and s.owner = auth.uid()));
create policy "members: self read" on public.send_members for select using (user_id = auth.uid());
create policy "messages: member read" on public.send_messages for select using (exists (select 1 from public.send_members m where m.send_id = send_messages.send_id and (m.user_id = auth.uid())) or exists (select 1 from public.sends s where s.id = send_messages.send_id and s.owner = auth.uid()));
create policy "messages: member write" on public.send_messages for insert with check (exists (select 1 from public.send_members m where m.send_id = send_messages.send_id and m.user_id = auth.uid()) or exists (select 1 from public.sends s where s.id = send_messages.send_id and s.owner = auth.uid()));

-- live chat: let clients subscribe to new messages
alter publication supabase_realtime add table public.send_messages;
alter publication supabase_realtime add table public.send_members;
