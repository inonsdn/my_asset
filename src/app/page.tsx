"use client";
import SummaryCards from "@/components/dashboard/SummaryCards";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import InvestmentSummary from "@/components/dashboard/InvestmentSummary";
import PortfolioHistoryChart from "@/components/dashboard/PortfolioHistoryChart";
import QuickActions from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Your complete financial overview</p>
      </div>
      <SummaryCards />
      <PortfolioHistoryChart />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashFlowChart />
        </div>
        <div className="space-y-6">
          <InvestmentSummary />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
