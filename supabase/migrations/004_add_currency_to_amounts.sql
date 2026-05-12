-- Add currency column to all tables with monetary fields
ALTER TABLE cost_items ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
ALTER TABLE investment_entries ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
ALTER TABLE dca_configs ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
ALTER TABLE retirement_configs ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS income_currency text NOT NULL DEFAULT 'USD';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bonus_currency text NOT NULL DEFAULT 'USD';
