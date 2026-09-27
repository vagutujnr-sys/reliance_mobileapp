-- Reliance Mobility operational schema.
-- Apply in the Supabase SQL editor or with the Supabase CLI.
-- Driver and client sessions are verified by the Next.js server.
-- The service role is the only key that can read PIN hashes.
-- Anon and authenticated roles have no access to credential tables.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('super_admin', 'admin', 'driver', 'client')),
  full_name text not null,
  phone text unique,
  email text unique,
  avatar_url text,
  account_status text not null default 'pending' check (account_status in ('pending', 'active', 'suspended', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('super_admin', 'admin')
      and account_status = 'active'
  );
$$;

create table public.mobile_credentials (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  phone text not null unique,
  pin_hash text not null,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create table public.staff_secrets (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  email text not null unique,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id),
  full_name text not null,
  phone text not null unique,
  email text,
  company text,
  address text,
  account_status text not null default 'pending',
  app_access boolean not null default false,
  chat_override text not null default 'auto' check (chat_override in ('auto', 'open', 'closed')),
  created_at timestamptz not null default now()
);

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id),
  full_name text not null,
  phone text not null unique,
  email text,
  driver_code text not null unique,
  licence_number text,
  licence_expiry date,
  national_id text,
  account_status text not null default 'pending',
  app_access boolean not null default false,
  cars_transported integer not null default 0,
  distance_km numeric not null default 0,
  last_active_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.clients(id),
  make text not null,
  model text not null,
  year integer not null,
  colour text not null,
  registration text not null,
  reference_number text not null,
  vin text not null,
  engine_number text not null,
  insurance_status text not null check (insurance_status in ('insured', 'not_insured')),
  insurance_provider text,
  insurance_expiry date,
  origin text not null,
  destination text not null,
  expected_departure timestamptz,
  estimated_arrival timestamptz,
  shipping_reference text,
  status text not null,
  image_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id),
  origin text not null,
  destination text not null,
  origin_lat double precision not null,
  origin_lng double precision not null,
  destination_lat double precision not null,
  destination_lng double precision not null,
  pickup_at timestamptz not null,
  eta timestamptz not null,
  status text not null,
  distance_km numeric not null default 0,
  shipping_reference text,
  checkpoint_ids uuid[] not null default '{}',
  notes text,
  arrived_at timestamptz,
  arrived_lat double precision,
  arrived_lng double precision,
  started_at timestamptz,
  started_lat double precision,
  started_lng double precision,
  completed_at timestamptz,
  completed_lat double precision,
  completed_lng double precision,
  created_at timestamptz not null default now()
);

create table public.trip_assignments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  driver_id uuid not null references public.drivers(id),
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  active boolean not null default true
);

create table public.trip_images (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  slot text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create table public.inspections (
  trip_id uuid primary key references public.trips(id) on delete cascade,
  exterior text not null,
  tyres text not null,
  windows text not null,
  lights text not null,
  fuel_level text not null,
  visible_damage boolean not null default false,
  notes text not null default '',
  completed_at timestamptz not null default now()
);

create table public.trip_locations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  driver_id uuid not null references public.drivers(id),
  vehicle_id uuid not null references public.vehicles(id),
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  heading double precision,
  speed_kmh double precision,
  recorded_at timestamptz not null default now()
);

create table public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  country text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer not null,
  active boolean not null default true,
  sort_order integer not null
);

create table public.trip_checkpoints (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id),
  checkpoint_id uuid not null references public.checkpoints(id),
  reached_at timestamptz not null default now(),
  source text not null check (source in ('geofence', 'admin')),
  unique (trip_id, checkpoint_id)
);

create table public.vehicle_handovers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id),
  vehicle_id uuid not null references public.vehicles(id),
  from_driver_id uuid not null references public.drivers(id),
  to_driver_id uuid references public.drivers(id),
  token text not null unique,
  code text not null,
  status text not null,
  expires_at timestamptz not null,
  latitude double precision,
  longitude double precision,
  notes text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create table public.driver_documents (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  kind text not null,
  file_name text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  client_id uuid not null references public.clients(id),
  vehicle_id uuid not null references public.vehicles(id),
  status text not null,
  issued_on timestamptz not null,
  due_on timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null,
  unit_price numeric not null,
  total numeric not null
);

create sequence public.invoice_number_seq start 1;
create sequence public.receipt_number_seq start 1;

create or replace function public.next_invoice_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return 'INV-' || extract(year from now())::text || '-' || lpad(nextval('public.invoice_number_seq')::text, 4, '0');
end;
$$;

create or replace function public.next_receipt_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return 'RCT-' || extract(year from now())::text || '-' || lpad(nextval('public.receipt_number_seq')::text, 4, '0');
end;
$$;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  vehicle_id uuid not null references public.vehicles(id),
  invoice_id uuid references public.invoices(id),
  kind text not null,
  description text not null,
  amount numeric not null,
  status text not null,
  method text,
  reference text,
  proof_url text,
  paid_on timestamptz,
  created_at timestamptz not null default now()
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  payment_id uuid not null references public.payments(id),
  client_id uuid not null references public.clients(id),
  vehicle_id uuid not null references public.vehicles(id),
  invoice_id uuid references public.invoices(id),
  amount numeric not null,
  method text not null,
  reference text not null,
  issued_on timestamptz not null
);

create table public.driver_payments (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id),
  trip_id uuid references public.trips(id),
  vehicle_id uuid references public.vehicles(id),
  route text not null,
  amount numeric not null,
  status text not null,
  reference text not null,
  paid_on timestamptz,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('driver_admin', 'client_admin')),
  participant_id uuid not null,
  profile_id uuid not null references public.profiles(id),
  title text not null,
  last_message text not null default '',
  last_message_at timestamptz not null default now(),
  unread_for_profile integer not null default 0,
  unread_for_admin integer not null default 0
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_role text not null,
  sender_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_name text not null,
  event_type text not null,
  entity text not null,
  entity_id text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table public.auth_attempts (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  ip text not null,
  success boolean not null,
  created_at timestamptz not null default now()
);

create table public.company_settings (
  id boolean primary key default true check (id),
  company_name text not null,
  tagline text not null,
  support_phone text not null,
  support_email text not null,
  payment_instructions text not null
);

insert into public.company_settings (company_name, tagline, support_phone, support_email, payment_instructions)
values (
  'Reliance Mobility Solutions',
  'Driving Possibilities. Delivering Trust.',
  '+263 77 200 0000',
  'operations@reliancemobility.co.zw',
  'Pay by bank transfer using your invoice number as the reference.'
);

create index trips_vehicle_idx on public.trips (vehicle_id, status);
create index assignments_driver_idx on public.trip_assignments (driver_id, active);
create index locations_trip_idx on public.trip_locations (trip_id, recorded_at desc);
create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index payments_client_idx on public.payments (client_id, status);
create index auth_attempts_ip_idx on public.auth_attempts (ip, created_at desc);

-- Client-safe milestone view. It exposes city progress and never driver GPS.
create view public.client_milestones as
select
  tc.id,
  tc.trip_id,
  tc.vehicle_id,
  tc.reached_at,
  c.name,
  c.city,
  c.country
from public.trip_checkpoints tc
join public.checkpoints c on c.id = tc.checkpoint_id;

alter table public.profiles enable row level security;
alter table public.mobile_credentials enable row level security;
alter table public.staff_secrets enable row level security;
alter table public.clients enable row level security;
alter table public.drivers enable row level security;
alter table public.vehicles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_assignments enable row level security;
alter table public.trip_images enable row level security;
alter table public.inspections enable row level security;
alter table public.trip_locations enable row level security;
alter table public.checkpoints enable row level security;
alter table public.trip_checkpoints enable row level security;
alter table public.vehicle_handovers enable row level security;
alter table public.driver_documents enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.receipts enable row level security;
alter table public.driver_payments enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
alter table public.auth_attempts enable row level security;
alter table public.company_settings enable row level security;

revoke all on public.mobile_credentials from anon, authenticated;
revoke all on public.staff_secrets from anon, authenticated;
revoke all on public.auth_attempts from anon, authenticated;
revoke all on public.trip_locations from anon, authenticated;

grant select on public.trip_locations to authenticated;

create policy staff_profiles on public.profiles for all using (public.is_staff()) with check (public.is_staff());
create policy staff_clients on public.clients for all using (public.is_staff()) with check (public.is_staff());
create policy staff_drivers on public.drivers for all using (public.is_staff()) with check (public.is_staff());
create policy staff_vehicles on public.vehicles for all using (public.is_staff()) with check (public.is_staff());
create policy staff_trips on public.trips for all using (public.is_staff()) with check (public.is_staff());
create policy staff_locations on public.trip_locations for select using (public.is_staff());
create policy staff_checkpoints on public.checkpoints for select using (true);
create policy staff_milestones on public.trip_checkpoints for all using (public.is_staff()) with check (public.is_staff());
create policy client_own_milestones on public.trip_checkpoints for select using (
  exists (
    select 1 from public.vehicles v
    join public.clients c on c.id = v.owner_id
    where v.id = trip_checkpoints.vehicle_id and c.profile_id = auth.uid()
  )
);
create policy client_own_vehicles on public.vehicles for select using (
  exists (select 1 from public.clients c where c.id = vehicles.owner_id and c.profile_id = auth.uid())
);
create policy client_own_invoices on public.invoices for select using (
  exists (select 1 from public.clients c where c.id = invoices.client_id and c.profile_id = auth.uid())
);
create policy client_own_payments on public.payments for select using (
  exists (select 1 from public.clients c where c.id = payments.client_id and c.profile_id = auth.uid())
);

insert into storage.buckets (id, name, public)
values
  ('vehicle-images', 'vehicle-images', true),
  ('trip-images', 'trip-images', false),
  ('driver-documents', 'driver-documents', false),
  ('vehicle-documents', 'vehicle-documents', false),
  ('payment-proofs', 'payment-proofs', false),
  ('avatars', 'avatars', false),
  ('invoice-assets', 'invoice-assets', false)
on conflict (id) do nothing;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'trip_locations') then
      alter publication supabase_realtime add table public.trip_locations;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages') then
      alter publication supabase_realtime add table public.messages;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'trip_checkpoints') then
      alter publication supabase_realtime add table public.trip_checkpoints;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end $$;
