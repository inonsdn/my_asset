// Converts DB rows (snake_case) ↔ app domain types (camelCase)
import type {
  ProfileRow, CostItemRow, InvestmentRow,
  InvestmentEntryRow, DCAConfigRow, RetirementConfigRow,
  PortfolioSnapshotRow,
} from "./schema";
import type {
  FinancialProfile, CostItem, Investment,
  InvestmentEntry, DCAConfig, RetirementConfig,
  PortfolioSnapshot,
} from "../types";

// ── Profile ──────────────────────────────────────────────────
export function profileFromRow(row: ProfileRow): Omit<FinancialProfile, "monthlyCosts" | "yearlyCosts"> {
  return {
    monthlyIncome: Number(row.monthly_income),
    yearlyBonusIncome: Number(row.yearly_bonus_income),
    currency: row.currency,
    monthlyIncomeCurrency: row.monthly_income_currency ?? "USD",
    yearlyBonusIncomeCurrency: row.yearly_bonus_income_currency ?? "USD",
  };
}

export function profileToInsert(p: FinancialProfile, id: string): ProfileRow {
  return {
    id,
    monthly_income: p.monthlyIncome,
    yearly_bonus_income: p.yearlyBonusIncome,
    currency: p.currency,
    monthly_income_currency: p.monthlyIncomeCurrency,
    yearly_bonus_income_currency: p.yearlyBonusIncomeCurrency,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ── Cost items ────────────────────────────────────────────────
export function costItemFromRow(row: CostItemRow): CostItem & { frequency: "monthly" | "yearly" } {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    category: row.category,
    amountCurrency: row.amount_currency ?? "USD",
    frequency: row.frequency,
  };
}

export function costItemToInsert(
  item: CostItem,
  profileId: string,
  frequency: "monthly" | "yearly"
): Omit<CostItemRow, "created_at"> {
  return {
    id: item.id,
    profile_id: profileId,
    name: item.name,
    amount: item.amount,
    category: item.category,
    amount_currency: item.amountCurrency ?? "USD",
    frequency,
  };
}

// ── Investment ────────────────────────────────────────────────
export function investmentFromRow(
  row: InvestmentRow,
  entries: InvestmentEntry[]
): Investment {
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    type: row.type,
    entries,
  };
}

export function investmentToInsert(
  inv: Investment,
  profileId: string
): Omit<InvestmentRow, "created_at"> {
  return {
    id: inv.id,
    profile_id: profileId,
    symbol: inv.symbol,
    name: inv.name,
    type: inv.type,
  };
}

// ── Investment entry ──────────────────────────────────────────
export function entryFromRow(row: InvestmentEntryRow): InvestmentEntry {
  return {
    id: row.id,
    date: row.date,
    quantity: Number(row.quantity),
    pricePerUnit: Number(row.price_per_unit),
    totalCost: Number(row.total_cost),
    pricePerUnitCurrency: row.price_per_unit_currency ?? "USD",
    note: row.note ?? undefined,
  };
}

export function entryToInsert(
  entry: InvestmentEntry,
  investmentId: string
): Omit<InvestmentEntryRow, "created_at"> {
  return {
    id: entry.id,
    investment_id: investmentId,
    date: entry.date,
    quantity: entry.quantity,
    price_per_unit: entry.pricePerUnit,
    total_cost: entry.totalCost,
    price_per_unit_currency: entry.pricePerUnitCurrency ?? "USD",
    note: entry.note ?? null,
  };
}

// ── DCA config ────────────────────────────────────────────────
export function dcaConfigFromRow(row: DCAConfigRow): DCAConfig {
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    type: row.type,
    monthlyAmount: Number(row.monthly_amount),
    expectedAnnualReturn: Number(row.expected_annual_return),
    startDate: row.start_date,
    years: row.years,
    monthlyAmountCurrency: row.monthly_amount_currency ?? "USD",
  };
}

export function dcaConfigToInsert(
  cfg: DCAConfig,
  profileId: string
): Omit<DCAConfigRow, "created_at"> {
  return {
    id: cfg.id,
    profile_id: profileId,
    symbol: cfg.symbol,
    name: cfg.name,
    type: cfg.type,
    monthly_amount: cfg.monthlyAmount,
    expected_annual_return: cfg.expectedAnnualReturn,
    start_date: cfg.startDate,
    years: cfg.years,
    monthly_amount_currency: cfg.monthlyAmountCurrency ?? "USD",
  };
}

// ── Retirement config ─────────────────────────────────────────
export function retirementConfigFromRow(row: RetirementConfigRow): RetirementConfig {
  return {
    currentAge: row.current_age,
    retirementAge: row.retirement_age,
    currentSavings: Number(row.current_savings),
    currentSavingsCurrency: row.current_savings_currency ?? "USD",
    monthlyContribution: Number(row.monthly_contribution),
    monthlyContributionCurrency: row.monthly_contribution_currency ?? "USD",
    expectedAnnualReturn: Number(row.expected_annual_return),
    expectedInflation: Number(row.expected_inflation),
    monthlyExpensesInRetirement: Number(row.monthly_expenses_in_retirement),
    monthlyExpensesInRetirementCurrency: row.monthly_expenses_in_retirement_currency ?? "USD",
  };
}

export function retirementConfigToInsert(
  cfg: RetirementConfig,
  profileId: string,
  id: string
): Omit<RetirementConfigRow, "created_at" | "updated_at"> {
  return {
    id,
    profile_id: profileId,
    current_age: cfg.currentAge,
    retirement_age: cfg.retirementAge,
    current_savings: cfg.currentSavings,
    current_savings_currency: cfg.currentSavingsCurrency ?? "USD",
    monthly_contribution: cfg.monthlyContribution,
    monthly_contribution_currency: cfg.monthlyContributionCurrency ?? "USD",
    expected_annual_return: cfg.expectedAnnualReturn,
    expected_inflation: cfg.expectedInflation,
    monthly_expenses_in_retirement: cfg.monthlyExpensesInRetirement,
    monthly_expenses_in_retirement_currency: cfg.monthlyExpensesInRetirementCurrency ?? "USD",
  };
}

// ── Portfolio snapshots ───────────────────────────────────────
export function snapshotFromRow(row: PortfolioSnapshotRow): PortfolioSnapshot {
  return {
    id: row.id,
    snapshotDate: row.snapshot_date,
    totalValueUsd: Number(row.total_value_usd),
    valueBySymbol: row.value_by_symbol ?? {},
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
}

export function snapshotToInsert(
  snap: Omit<PortfolioSnapshot, "id" | "createdAt">,
  profileId: string,
  id: string
): Omit<PortfolioSnapshotRow, "created_at"> {
  return {
    id,
    profile_id: profileId,
    snapshot_date: snap.snapshotDate,
    total_value_usd: snap.totalValueUsd,
    value_by_symbol: snap.valueBySymbol,
    note: snap.note ?? null,
  };
}
