-- Scruffy Butts Supabase schema

-- The appointments table stores all bookings along with optional push subscription
-- information.  The push_subscription column holds a JSON object returned from
-- the pushManager.subscribe() call.  When using this schema, make sure to
-- enable the pgcrypto extension so gen_random_uuid() works correctly.

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  owner_name text not null,
  phone text not null,
  email text,
  pet_name text not null,
  breed text,
  weight text,
  service text not null,
  notes text,
  date date not null,
  time text not null,
  status text not null default 'requested',
  carrier text,
  sms_opt_in boolean default true,
  push_subscription json
);

-- Enable row level security and define policies.  We allow anonymous inserts so
-- that clients can create appointments without authentication.  The service
-- role (used in server-side calls) has full access.
alter table appointments enable row level security;
create policy "public can insert appointments" on appointments
  for insert to anon with check (true);
create policy "service role can manage" on appointments
  for all using (true) with check (true);