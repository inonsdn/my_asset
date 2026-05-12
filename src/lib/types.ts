export interface FinancialProfile {
  monthlyIncome: number;
  monthlyIncomeCurrency: string;
  yearlyBonusIncome: number;
  yearlyBonusIncomeCurrency: string;
  monthlyCosts: CostItem[];
  yearlyCosts: CostItem[];
  currency: string;
}

export interface CostItem {
  id: string;
  name: string;
  amount: number;
  amountCurrency: string;
  category: string;
}

export interface Investment {
  id: string;
  symbol: string;
  name: string;
  type: "stock" | "etf" | "crypto" | "gold" | "other";
  entries: InvestmentEntry[];
}

export interface InvestmentEntry {
  id: string;
  date: string;
  quantity: number;
  pricePerUnit: number;
  pricePerUnitCurrency: string;
  totalCost: number;
  note?: string;
}

export interface DCAConfig {
  id: string;
  symbol: string;
  name: string;
  type: "stock" | "etf" | "crypto" | "gold" | "other";
  monthlyAmount: number;
  monthlyAmountCurrency: string;
  expectedAnnualReturn: number;
  startDate: string;
  years: number;
}

export interface RetirementConfig {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  currentSavingsCurrency: string;
  monthlyContribution: number;
  monthlyContributionCurrency: string;
  expectedAnnualReturn: number;
  expectedInflation: number;
  monthlyExpensesInRetirement: number;
  monthlyExpensesInRetirementCurrency: string;
}

export interface MarketPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  lastUpdated: string;
}

export interface PortfolioSnapshot {
  id: string;
  snapshotDate: string;       // 'YYYY-MM-DD'
  totalValueUsd: number;      // always stored in USD
  valueBySymbol: Record<string, { qty: number; priceUsd: number; valueUsd: number }>;
  note?: string;
  createdAt: string;
}
