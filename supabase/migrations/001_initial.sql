-- ============================================================
-- FinanceOS — initial schema
-- Apply via: supabase db push  OR paste into Supabase SQL editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── profiles ────────────────────────────────────────────────
-- One row per device/user. profile_id is generated client-side
-- and stored in localStorage. No auth required.
create table if not exists profiles (
  id                   uuid        primary key,
  monthly_income       numeric(15,2) not null default 0,
  yearly_bonus_income  numeric(15,2) not null default 0,
  currency             text          not null default 'USD',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── cost_items ───────────────────────────────────────────────
-- Both monthly and yearly costs, distinguished by `frequency`.
create table if not exists cost_items (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        not null references profiles(id) on delete cascade,
  name        text        not null,
  amount      numeric(15,2) not null,
  category    text        not null default 'other',
  frequency   text        not null check (frequency in ('monthly', 'yearly')),
  created_at  timestamptz not null default now()
);

create index if not exists cost_items_profile_idx on cost_items(profile_id);

-- ── investments ──────────────────────────────────────────────
create table if not exists investments (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        not null references profiles(id) on delete cascade,
  symbol      text        not null,
  name        text        not null,
  type        text        not null check (type in ('stock','etf','crypto','gold','other')),
  created_at  timestamptz not null default now()
);

create index if not exists investments_profile_idx on investments(profile_id);

-- ── investment_entries ───────────────────────────────────────
-- Individual purchase records for each investment.
create table if not exists investment_entries (
  id               uuid        primary key default gen_random_uuid(),
  investment_id    uuid        not null references investments(id) on delete cascade,
  date             date        not null,
  quantity         numeric(20,8) not null,
  price_per_unit   numeric(20,8) not null,
  total_cost       numeric(15,2) not null,
  note             text,
  created_at       timestamptz not null default now()
);

create index if not exists investment_entries_investment_idx on investment_entries(investment_id);

-- ── dca_configs ──────────────────────────────────────────────
create table if not exists dca_configs (
  id                     uuid        primary key default gen_random_uuid(),
  profile_id             uuid        not null references profiles(id) on delete cascade,
  symbol                 text        not null,
  name                   text        not null,
  type                   text        not null check (type in ('stock','etf','crypto','gold','other')),
  monthly_amount         numeric(15,2) not null,
  expected_annual_return numeric(5,2) not null,
  start_date             date        not null,
  years                  integer     not null check (years > 0),
  created_at             timestamptz not null default now()
);

create index if not exists dca_configs_profile_idx on dca_configs(profile_id);

-- ── retirement_configs ───────────────────────────────────────
-- One row per profile (upserted).
create table if not exists retirement_configs (
  id                             uuid        primary key default gen_random_uuid(),
  profile_id                     uuid        not null unique references profiles(id) on delete cascade,
  current_age                    integer     not null default 30,
  retirement_age                 integer     not null default 60,
  current_savings                numeric(15,2) not null default 0,
  monthly_contribution           numeric(15,2) not null default 1000,
  expected_annual_return         numeric(5,2) not null default 7,
  expected_inflation             numeric(5,2) not null default 3,
  monthly_expenses_in_retirement numeric(15,2) not null default 3000,
  created_at                     timestamptz not null default now(),
  updated_at                     timestamptz not null default now()
);

-- ── updated_at trigger helper ────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create or replace trigger retirement_configs_updated_at
  before update on retirement_configs
  for each row execute function set_updated_at();
