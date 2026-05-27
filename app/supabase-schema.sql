-- =============================================================
-- app.ghanney.com — Personal portal schema
-- Run this in Supabase SQL Editor on a fresh project.
-- =============================================================

-- =============================================================
-- 1. PROFILES (linked to auth.users)
-- =============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  initials text,
  role text not null default 'Owner',
  location text,
  external_org text,
  two_fa boolean default false,
  status text default 'Active',           -- Active | Pending | Suspended
  joined_at timestamptz default now(),
  last_active_at timestamptz default now()
);
alter table public.profiles enable row level security;

create policy "owner_read_all_profiles" on public.profiles
  for select using ( auth.uid() is not null );

create policy "self_update_profile" on public.profiles
  for update using ( auth.uid() = id );

create policy "owner_insert_profiles" on public.profiles
  for insert with check ( auth.uid() is not null );

create policy "owner_delete_profiles" on public.profiles
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Owner')
  );

-- Auto-create profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'Owner')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================
-- 2. INCOME — streams + records
-- =============================================================
create table public.income_streams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  label text not null,
  type text,                                -- Salary | Commission | Referral | Distribution | Rental
  cadence text,                             -- Monthly | Per deal | etc.
  gross numeric default 0,
  currency text default 'USD',
  status text default 'Active',             -- Active | Deferred | Paused
  deferred_since text,
  deferred_months int,
  accrued numeric default 0,
  ytd numeric default 0,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.income_streams enable row level security;
create policy "auth_all_income_streams" on public.income_streams for all
  using ( auth.uid() is not null ) with check ( auth.uid() is not null );

create table public.income_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  stream_id uuid references public.income_streams(id) on delete set null,
  type text,
  source text not null,
  amount numeric not null default 0,
  currency text default 'USD',
  received_on date default current_date,
  note text,
  created_at timestamptz default now()
);
alter table public.income_records enable row level security;
create policy "auth_all_income_records" on public.income_records for all
  using ( auth.uid() is not null ) with check ( auth.uid() is not null );

-- =============================================================
-- 3. INVESTMENTS + payments + site updates
-- =============================================================
create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  kind text,                                -- Real Estate | Real Estate Development | Business | Government Contract (SPV)
  sub text,
  location text,
  developer text,
  currency text default 'USD',
  price_total numeric default 0,
  paid numeric default 0,
  equity numeric,                           -- 0-1
  monthly_distribution numeric,
  next_payment_amount numeric,
  next_payment_date date,
  progress numeric default 0,               -- 0-1
  handover text,
  value_now numeric default 0,
  yield_exp text,
  fx_to_usd numeric,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.investments enable row level security;
create policy "auth_all_investments" on public.investments for all
  using ( auth.uid() is not null ) with check ( auth.uid() is not null );

create table public.investment_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  investment_id uuid references public.investments(id) on delete cascade,
  amount numeric not null default 0,
  currency text default 'USD',
  paid_on date default current_date,
  method text,
  note text,
  created_at timestamptz default now()
);
alter table public.investment_payments enable row level security;
create policy "auth_all_inv_payments" on public.investment_payments for all
  using ( auth.uid() is not null ) with check ( auth.uid() is not null );

create table public.site_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  investment_id uuid references public.investments(id) on delete cascade,
  milestone text not null,
  progress numeric default 0,               -- 0-1
  date date default current_date,
  reporter text,
  photos int default 0,
  notes text,
  status text default 'verified',           -- verified | pending
  created_at timestamptz default now()
);
alter table public.site_updates enable row level security;
create policy "auth_all_site_updates" on public.site_updates for all
  using ( auth.uid() is not null ) with check ( auth.uid() is not null );

-- =============================================================
-- 4. LOANS + payments
-- =============================================================
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  borrower text not null,
  type text default 'Individual',           -- Individual | Business
  principal numeric not null default 0,
  currency text default 'USD',
  issued_on date default current_date,
  due_on date,
  interest numeric default 0,               -- 0-1 (decimal APR)
  status text default 'On track',           -- On track | Due soon | Overdue | Family | Paid
  paid_back numeric default 0,
  next_payment_amount numeric,
  next_payment_date date,
  secured_by text,
  repayment_plan text default 'monthly',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.loans enable row level security;
create policy "auth_all_loans" on public.loans for all
  using ( auth.uid() is not null ) with check ( auth.uid() is not null );

create table public.loan_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  loan_id uuid references public.loans(id) on delete cascade,
  amount numeric not null default 0,
  paid_on date default current_date,
  note text,
  created_at timestamptz default now()
);
alter table public.loan_payments enable row level security;
create policy "auth_all_loan_payments" on public.loan_payments for all
  using ( auth.uid() is not null ) with check ( auth.uid() is not null );

-- =============================================================
-- 5. TRADING (positions + history)
-- =============================================================
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  symbol text not null,
  name text,
  cls text,                                 -- Stock | ETF | Crypto
  action text,                              -- Buy | Sell
  qty numeric default 0,
  price numeric default 0,
  venue text,
  executed_on date default current_date,
  notes text,
  created_at timestamptz default now()
);
alter table public.trades enable row level security;
create policy "auth_all_trades" on public.trades for all
  using ( auth.uid() is not null ) with check ( auth.uid() is not null );

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  symbol text not null,
  name text,
  cls text,
  qty numeric default 0,
  avg_price numeric default 0,
  last_price numeric default 0,
  updated_at timestamptz default now(),
  unique (user_id, symbol)
);
alter table public.positions enable row level security;
create policy "auth_all_positions" on public.positions for all
  using ( auth.uid() is not null ) with check ( auth.uid() is not null );

-- =============================================================
-- 6. PROJECTS
-- =============================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  status text default 'In progress',        -- In progress | Active | Evaluating | On hold | Done
  owner text,
  progress numeric default 0,               -- 0-1
  deadline text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.projects enable row level security;
create policy "auth_all_projects" on public.projects for all
  using ( auth.uid() is not null ) with check ( auth.uid() is not null );

-- =============================================================
-- 7. CONTRACTS (file metadata; files in Storage)
-- =============================================================
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text,
  parties text[] default '{}',
  value numeric default 0,
  currency text default 'USD',
  linked_kind text,                          -- investment | loan | income | project
  linked_id uuid,
  linked_label text,
  status text default 'Active',              -- Active | Pending signature | Awaiting review | Expiring soon | Expired | Terminated | Draft
  signed_date date,
  effective_date text,
  expires_date text,
  file_path text,                            -- Supabase Storage path: contracts/{user}/{file}
  file_name text,
  file_size_bytes bigint,
  pages int,
  uploaded_by text,
  uploaded_at timestamptz default now(),
  notes text,
  attachments int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.contracts enable row level security;
create policy "auth_all_contracts" on public.contracts for all
  using ( auth.uid() is not null ) with check ( auth.uid() is not null );

-- =============================================================
-- 8. NET WORTH SNAPSHOTS (auto-aggregated periodically)
-- =============================================================
create table public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  snapshot_date date default current_date,
  value numeric default 0,
  breakdown jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique (user_id, snapshot_date)
);
alter table public.net_worth_snapshots enable row level security;
create policy "auth_all_networth" on public.net_worth_snapshots for all
  using ( auth.uid() is not null ) with check ( auth.uid() is not null );

-- =============================================================
-- 9. ACTIVITY LOG (auto-populated by triggers + manual entries)
-- =============================================================
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  actor uuid references auth.users(id) on delete set null,
  actor_name text,
  action text,                              -- created | updated | deleted | uploaded
  entity text,                              -- loan | investment | trade | etc.
  entity_id uuid,
  message text,
  tag text,                                 -- loan | trade | income | contract | etc.
  created_at timestamptz default now()
);
alter table public.activity_log enable row level security;
create policy "auth_all_activity" on public.activity_log for all
  using ( auth.uid() is not null ) with check ( auth.uid() is not null );

-- =============================================================
-- 10. STORAGE — create a bucket called "contracts"
-- =============================================================
-- Run this AFTER creating the "contracts" bucket in the Storage UI:
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

create policy "auth_read_contracts" on storage.objects
  for select using ( bucket_id = 'contracts' and auth.uid() is not null );
create policy "auth_write_contracts" on storage.objects
  for insert with check ( bucket_id = 'contracts' and auth.uid() is not null );
create policy "auth_update_contracts" on storage.objects
  for update using ( bucket_id = 'contracts' and auth.uid() is not null );
create policy "auth_delete_contracts" on storage.objects
  for delete using ( bucket_id = 'contracts' and auth.uid() is not null );

-- =============================================================
-- Indexes for common queries
-- =============================================================
create index if not exists income_records_user_received on public.income_records (user_id, received_on desc);
create index if not exists investments_user on public.investments (user_id, updated_at desc);
create index if not exists loans_user_due on public.loans (user_id, due_on);
create index if not exists trades_user_executed on public.trades (user_id, executed_on desc);
create index if not exists contracts_user_expires on public.contracts (user_id, expires_date);
create index if not exists activity_user_created on public.activity_log (user_id, created_at desc);
