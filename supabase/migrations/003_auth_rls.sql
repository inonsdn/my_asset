-- ============================================================
-- FinanceOS — Auth-scoped RLS policies (optional upgrade)
-- Run this AFTER 002_rls_policies.sql to tighten security so
-- each authenticated user can only access their own rows.
-- Guest (anon) users still have full access via profile_id.
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
drop policy if exists "anon full access" on profiles;

create policy "anon full access" on profiles
  for all to anon using (true) with check (true);

create policy "auth own rows" on profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── cost_items ───────────────────────────────────────────────
drop policy if exists "anon full access" on cost_items;

create policy "anon full access" on cost_items
  for all to anon using (true) with check (true);

create policy "auth own rows" on cost_items
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ── investments ──────────────────────────────────────────────
drop policy if exists "anon full access" on investments;

create policy "anon full access" on investments
  for all to anon using (true) with check (true);

create policy "auth own rows" on investments
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ── investment_entries ───────────────────────────────────────
drop policy if exists "anon full access" on investment_entries;

create policy "anon full access" on investment_entries
  for all to anon using (true) with check (true);

create policy "auth own rows" on investment_entries
  for all to authenticated
  using (
    investment_id in (
      select id from investments where profile_id = auth.uid()
    )
  )
  with check (
    investment_id in (
      select id from investments where profile_id = auth.uid()
    )
  );

-- ── dca_configs ──────────────────────────────────────────────
drop policy if exists "anon full access" on dca_configs;

create policy "anon full access" on dca_configs
  for all to anon using (true) with check (true);

create policy "auth own rows" on dca_configs
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ── retirement_configs ───────────────────────────────────────
drop policy if exists "anon full access" on retirement_configs;

create policy "anon full access" on retirement_configs
  for all to anon using (true) with check (true);

create policy "auth own rows" on retirement_configs
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
