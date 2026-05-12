-- Rename currency columns to follow {field_name}_currency pattern
ALTER TABLE profiles RENAME COLUMN income_currency TO monthly_income_currency;
ALTER TABLE profiles RENAME COLUMN bonus_currency TO yearly_bonus_income_currency;
ALTER TABLE cost_items RENAME COLUMN currency TO amount_currency;
ALTER TABLE investment_entries RENAME COLUMN currency TO price_per_unit_currency;
ALTER TABLE dca_configs RENAME COLUMN currency TO monthly_amount_currency;

-- Split retirement_configs.currency into one per monetary field
ALTER TABLE retirement_configs RENAME COLUMN currency TO current_savings_currency;
ALTER TABLE retirement_configs ADD COLUMN IF NOT EXISTS monthly_contribution_currency text NOT NULL DEFAULT 'USD';
ALTER TABLE retirement_configs ADD COLUMN IF NOT EXISTS monthly_expenses_in_retirement_currency text NOT NULL DEFAULT 'USD';

-- Portfolio snapshots table
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  total_value_usd numeric NOT NULL DEFAULT 0,
  value_by_symbol jsonb NOT NULL DEFAULT '{}',
  note text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolio_snapshots_profile_date_idx ON portfolio_snapshots(profile_id, snapshot_date);
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own snapshots" ON portfolio_snapshots FOR ALL USING (profile_id = auth.uid());
