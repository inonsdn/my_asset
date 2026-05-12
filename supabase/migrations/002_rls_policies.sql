-- ============================================================
-- FinanceOS — RLS policies
-- No auth: the anon key is allowed to read/write all rows.
-- The profile_id UUID (stored client-side) acts as the only
-- access boundary. This is fine for a single-user personal app.
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
alter table profiles enable row level security;

create policy "anon full access" on profiles
  for all to anon using (true) with check (true);

-- ── cost_items ───────────────────────────────────────────────
alter table cost_items enable row level security;

create policy "anon full access" on cost_items
  for all to anon using (true) with check (true);

-- ── investments ──────────────────────────────────────────────
alter table investments enable row level security;

create policy "anon full access" on investments
  for all to anon using (true) with check (true);

-- ── investment_entries ───────────────────────────────────────
alter table investment_entries enable row level security;

create policy "anon full access" on investment_entries
  for all to anon using (true) with check (true);

-- ── dca_configs ──────────────────────────────────────────────
alter table dca_configs enable row level security;

create policy "anon full access" on dca_configs
  for all to anon using (true) with check (true);

-- ── retirement_configs ───────────────────────────────────────
alter table retirement_configs enable row level security;

create policy "anon full access" on retirement_configs
  for all to anon using (true) with check (true);
