-- Calendar core schema for Phase 2

do $$ begin
  create type public.calendar_event_status as enum ('hold','pending','confirmed','cancelled','completed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.calendar_event_source as enum ('manual','vairidate','available_now','dateguard');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete set null,
  encounter_id uuid references public.encounters(id) on delete set null,
  title text,
  appointment_type text,
  location text,
  notes text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.calendar_event_status not null default 'pending',
  source public.calendar_event_source not null default 'manual',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_time_check check (end_time > start_time)
);

create index if not exists idx_calendar_events_provider_time
  on public.calendar_events(provider_id, start_time);

create index if not exists idx_calendar_events_client_time
  on public.calendar_events(client_id, start_time);

create trigger update_calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.update_updated_at_column();

create table if not exists public.calendar_rules (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  buffer_before_minutes integer not null default 0,
  buffer_after_minutes integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_rules_time_check check (end_time > start_time)
);

create index if not exists idx_calendar_rules_provider
  on public.calendar_rules(provider_id);

create trigger update_calendar_rules_updated_at
  before update on public.calendar_rules
  for each row execute function public.update_updated_at_column();

create table if not exists public.calendar_blackouts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_blackouts_time_check check (end_time > start_time)
);

create index if not exists idx_calendar_blackouts_provider
  on public.calendar_blackouts(provider_id, start_time);

create trigger update_calendar_blackouts_updated_at
  before update on public.calendar_blackouts
  for each row execute function public.update_updated_at_column();

alter table public.calendar_events enable row level security;
alter table public.calendar_rules enable row level security;
alter table public.calendar_blackouts enable row level security;

create policy if not exists "Providers manage their events"
  on public.calendar_events
  for all
  to authenticated
  using (auth.uid() = provider_id)
  with check (auth.uid() = provider_id);

create policy if not exists "Clients can view their events"
  on public.calendar_events
  for select
  to authenticated
  using (auth.uid() = provider_id or auth.uid() = client_id);

create policy if not exists "Providers manage their rules"
  on public.calendar_rules
  for all
  to authenticated
  using (auth.uid() = provider_id)
  with check (auth.uid() = provider_id);

create policy if not exists "Providers manage their blackouts"
  on public.calendar_blackouts
  for all
  to authenticated
  using (auth.uid() = provider_id)
  with check (auth.uid() = provider_id);

create or replace function public.check_appointment_conflict(
  p_provider_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_appointment_id uuid default null
)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.calendar_events
    where provider_id = p_provider_id
      and status <> 'cancelled'::public.calendar_event_status
      and (p_appointment_id is null or id <> p_appointment_id)
      and (
        (start_time <= p_start_time and end_time > p_start_time)
        or (start_time < p_end_time and end_time >= p_end_time)
        or (start_time >= p_start_time and end_time <= p_end_time)
      )
  );
end;
$$;

