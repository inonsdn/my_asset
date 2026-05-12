// Auto-kept in sync with supabase/migrations/001_initial.sql
// These are the exact shapes Supabase returns (snake_case).

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at">;
        Update: Partial<Omit<ProfileRow, "id" | "created_at" | "updated_at">>;
      };
      cost_items: {
        Row: CostItemRow;
        Insert: Omit<CostItemRow, "created_at">;
        Update: Partial<Omit<CostItemRow, "id" | "created_at">>;
      };
      investments: {
        Row: InvestmentRow;
        Insert: Omit<InvestmentRow, "created_at">;
        Update: Partial<Omit<InvestmentRow, "id" | "created_at">>;
      };
      investment_entries: {
        Row: InvestmentEntryRow;
        Insert: Omit<InvestmentEntryRow, "created_at">;
        Update: Partial<Omit<InvestmentEntryRow, "id" | "created_at">>;
      };
      dca_configs: {
        Row: DCAConfigRow;
        Insert: Omit<DCAConfigRow, "created_at">;
        Update: Partial<Omit<DCAConfigRow, "id" | "created_at">>;
      };
      retirement_configs: {
        Row: RetirementConfigRow;
        Insert: Omit<RetirementConfigRow, "created_at" | "updated_at">;
        Update: Partial<Omit<RetirementConfigRow, "id" | "created_at" | "updated_at">>;
      };
      portfolio_snapshots: {
        Row: PortfolioSnapshotRow;
        Insert: Omit<PortfolioSnapshotRow, "created_at">;
        Update: Partial<Omit<PortfolioSnapshotRow, "id" | "created_at">>;
      };
    };
  };
}

export interface ProfileRow {
  id: string;
  monthly_income: number;
  yearly_bonus_income: number;
  currency: string;
  monthly_income_currency: string;
  yearly_bonus_income_currency: string;
  created_at: string;
  updated_at: string;
}

export interface CostItemRow {
  id: string;
  profile_id: string;
  name: string;
  amount: number;
  amount_currency: string;
  category: string;
  frequency: "monthly" | "yearly";
  created_at: string;
}

export interface InvestmentRow {
  id: string;
  profile_id: string;
  symbol: string;
  name: string;
  type: "stock" | "etf" | "crypto" | "gold" | "other";
  created_at: string;
}

export interface InvestmentEntryRow {
  id: string;
  investment_id: string;
  date: string;
  quantity: number;
  price_per_unit: number;
  price_per_unit_currency: string;
  total_cost: number;
  note: string | null;
  created_at: string;
}

export interface DCAConfigRow {
  id: string;
  profile_id: string;
  symbol: string;
  name: string;
  type: "stock" | "etf" | "crypto" | "gold" | "other";
  monthly_amount: number;
  monthly_amount_currency: string;
  expected_annual_return: number;
  start_date: string;
  years: number;
  created_at: string;
}

export interface RetirementConfigRow {
  id: string;
  profile_id: string;
  current_age: number;
  retirement_age: number;
  current_savings: number;
  current_savings_currency: string;
  monthly_contribution: number;
  monthly_contribution_currency: string;
  expected_annual_return: number;
  expected_inflation: number;
  monthly_expenses_in_retirement: number;
  monthly_expenses_in_retirement_currency: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioSnapshotRow {
  id: string;
  profile_id: string;
  snapshot_date: string;
  total_value_usd: number;
  value_by_symbol: Record<string, { qty: number; priceUsd: number; valueUsd: number }>;
  note: string | null;
  created_at: string;
}
