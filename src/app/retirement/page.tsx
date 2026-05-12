"use client";
import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import MoneyInput from "@/components/ui/MoneyInput";
import { Save, CheckCircle } from "lucide-react";
import {
    ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { makeKFormatter } from "@/lib/utils";

function buildRetirementProjection(cfg: {
    currentAge: number;
    retirementAge: number;
    currentSavings: number;
    monthlyContribution: number;
    expectedAnnualReturn: number;
    expectedInflation: number;
    monthlyExpensesInRetirement: number;
}) {
    const {
        currentAge, retirementAge, currentSavings,
        monthlyContribution, expectedAnnualReturn,
        expectedInflation, monthlyExpensesInRetirement,
    } = cfg;

    const monthlyReturn = expectedAnnualReturn / 100 / 12;
    const monthlyInflation = expectedInflation / 100 / 12;
    const yearsToRetirement = retirementAge - currentAge;
    const maxYears = 100 - currentAge;

    const data: {
        age: number;
        savings: number;
        realSavings: number;
        phase: "accumulation" | "withdrawal";
    }[] = [];

    let savings = currentSavings;
    let cumulativeInflation = 1;

    for (let y = 0; y <= maxYears; y++) {
        const age = currentAge + y;
        if (y <= yearsToRetirement) {
            // Accumulation phase
            for (let m = 0; m < 12; m++) {
                savings = savings * (1 + monthlyReturn) + monthlyContribution;
                cumulativeInflation *= 1 + monthlyInflation;
            }
            data.push({
                age,
                savings: Math.round(savings),
                realSavings: Math.round(savings / cumulativeInflation),
                phase: "accumulation",
            });
        } else {
            // Withdrawal phase — inflate expenses
            const inflatedMonthlyExpense = monthlyExpensesInRetirement * cumulativeInflation;
            for (let m = 0; m < 12; m++) {
                savings = savings * (1 + monthlyReturn) - inflatedMonthlyExpense;
                cumulativeInflation *= 1 + monthlyInflation;
                if (savings <= 0) { savings = 0; break; }
            }
            data.push({
                age,
                savings: Math.round(Math.max(0, savings)),
                realSavings: Math.round(Math.max(0, savings) / cumulativeInflation),
                phase: "withdrawal",
            });
            if (savings <= 0) break;
        }
    }

    const atRetirement = data.find((d) => d.age === retirementAge);
    const depletionAge = data.find((d) => d.phase === "withdrawal" && d.savings === 0)?.age ?? null;
    const retirementSavings = atRetirement?.savings ?? 0;

    // Rule of 4% — sustainable annual withdrawal
    const sustainableAnnualWithdrawal = retirementSavings * 0.04;
    const sustainableMonthlyWithdrawal = sustainableAnnualWithdrawal / 12;
    const requiredNestEgg = monthlyExpensesInRetirement * 12 * 25;

    return {
        data,
        retirementSavings,
        depletionAge,
        sustainableMonthlyWithdrawal,
        requiredNestEgg,
        onTrack: retirementSavings >= requiredNestEgg,
        yearsToRetirement,
    };
}

export default function RetirementPage() {
    const { retirementConfig, updateRetirementConfig, investments } = useStore();
    const rc = retirementConfig;
    const { format, fromUSD, convertAmount, currency, symbol } = useCurrency();
    const [form, setForm] = useState({ ...retirementConfig });
    // String states for monetary inputs — avoids toFixed(2) re-formatting on every keystroke
    const [savingsStr, setSavingsStr] = useState(retirementConfig.currentSavings.toString());
    const [contribStr, setContribStr] = useState(retirementConfig.monthlyContribution.toString());
    const [expensesStr, setExpensesStr] = useState(retirementConfig.monthlyExpensesInRetirement.toString());
    const [saved, setSaved] = useState(false);
    const [includePortfolio, setIncludePortfolio] = useState(true);

    // Compute portfolio value from investments + market prices
    const symbols = investments.map((i) => i.symbol);
    const { prices } = useMarketPrices(symbols);
    const portfolioValueDisplay = investments.reduce((sum, inv) => {
        const qty = inv.entries.reduce((s, e) => s + e.quantity, 0);
        const price = prices[inv.symbol]?.price;
        return sum + (price ? fromUSD(price * qty) : 0);
    }, 0);

    // Sync from store when config or display currency changes
    useEffect(() => {
        const cs = convertAmount(rc.currentSavings, rc.currentSavingsCurrency ?? "USD", currency);
        const mc = convertAmount(rc.monthlyContribution, rc.monthlyContributionCurrency ?? "USD", currency);
        const me = convertAmount(rc.monthlyExpensesInRetirement, rc.monthlyExpensesInRetirementCurrency ?? "USD", currency);
        setForm((f) => ({
            ...f,
            currentSavings: cs,
            currentSavingsCurrency: rc.currentSavingsCurrency ?? "USD",
            monthlyContribution: mc,
            monthlyContributionCurrency: rc.monthlyContributionCurrency ?? "USD",
            monthlyExpensesInRetirement: me,
            monthlyExpensesInRetirementCurrency: rc.monthlyExpensesInRetirementCurrency ?? "USD",
        }));
        setSavingsStr(cs.toString());
        setContribStr(mc.toString());
        setExpensesStr(me.toString());
    }, [
        rc.currentSavings,
        rc.currentSavingsCurrency,
        rc.monthlyContribution,
        rc.monthlyContributionCurrency,
        rc.monthlyExpensesInRetirement,
        rc.monthlyExpensesInRetirementCurrency,
        convertAmount,
        currency,
    ]);

    const setField = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) || 0 }));

    const handleSave = () => {
        updateRetirementConfig({ ...form });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // Convert form values to display currency for projection
    const effectiveSavingsDisplay =
        convertAmount(form.currentSavings, form.currentSavingsCurrency ?? "USD", currency) +
        (includePortfolio ? portfolioValueDisplay : 0);
    const projectionInput = {
        ...form,
        currentSavings: effectiveSavingsDisplay,
        monthlyContribution: convertAmount(form.monthlyContribution, form.monthlyContributionCurrency ?? "USD", currency),
        monthlyExpensesInRetirement: convertAmount(form.monthlyExpensesInRetirement, form.monthlyExpensesInRetirementCurrency ?? "USD", currency),
    };
    const result = useMemo(() => buildRetirementProjection(projectionInput), [JSON.stringify(projectionInput)]); // eslint-disable-line react-hooks/exhaustive-deps
    const gapPct = result.requiredNestEgg > 0
        ? Math.min(100, (result.retirementSavings / result.requiredNestEgg) * 100)
        : 0;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Retirement Plan</h1>
                    <p className="text-slate-400 text-sm mt-1">Calculate when you can retire and how much you need</p>
                </div>
                <Button onClick={handleSave}>
                    {saved ? <CheckCircle size={16} /> : <Save size={16} />}
                    {saved ? "Saved!" : "Save"}
                </Button>
            </div>

            {/* Portfolio Value Card */}
            {portfolioValueDisplay > 0 && (
                <Card className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 mb-1">Portfolio Value (investments)</p>
                        <p className="text-xl font-bold text-emerald-400">{format(portfolioValueDisplay)}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            {includePortfolio ? "Included in retirement projection" : "Excluded from retirement projection"}
                        </p>
                    </div>
                    <Button
                        variant={includePortfolio ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setIncludePortfolio(!includePortfolio)}
                    >
                        {includePortfolio ? "Exclude" : "Include"}
                    </Button>
                </Card>
            )}

            {/* Inputs */}
            <Card>
                <h2 className="text-base font-semibold mb-4">Your Details</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Input label="Current Age" type="number" value={form.currentAge} onChange={setField("currentAge")} />
                    <Input label="Target Retirement Age" type="number" value={form.retirementAge} onChange={setField("retirementAge")} />
                    <MoneyInput
                        label="Current Savings"
                        value={savingsStr}
                        onValueChange={(v) => { setSavingsStr(v); setForm((f) => ({ ...f, currentSavings: parseFloat(v) || 0 })); }}
                        currency={form.currentSavingsCurrency ?? "USD"}
                        onCurrencyChange={(c) => setForm((f) => ({ ...f, currentSavingsCurrency: c }))}
                    />
                    <MoneyInput
                        label="Monthly Contribution"
                        value={contribStr}
                        onValueChange={(v) => { setContribStr(v); setForm((f) => ({ ...f, monthlyContribution: parseFloat(v) || 0 })); }}
                        currency={form.monthlyContributionCurrency ?? "USD"}
                        onCurrencyChange={(c) => setForm((f) => ({ ...f, monthlyContributionCurrency: c }))}
                    />
                    <Input label="Expected Annual Return" type="number" value={form.expectedAnnualReturn} onChange={setField("expectedAnnualReturn")} suffix="%" />
                    <Input label="Expected Inflation" type="number" value={form.expectedInflation} onChange={setField("expectedInflation")} suffix="%" />
                    <MoneyInput
                        label="Monthly Expenses in Retirement"
                        value={expensesStr}
                        onValueChange={(v) => { setExpensesStr(v); setForm((f) => ({ ...f, monthlyExpensesInRetirement: parseFloat(v) || 0 })); }}
                        currency={form.monthlyExpensesInRetirementCurrency ?? "USD"}
                        onCurrencyChange={(c) => setForm((f) => ({ ...f, monthlyExpensesInRetirementCurrency: c }))}
                    />
                </div>
            </Card>

            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Years to Retirement</p>
                    <p className="text-2xl font-bold text-blue-400">{result.yearsToRetirement}</p>
                </Card>
                <Card className="text-center">
                    <p className="text-xs text-slate-400 mb-1">At Retirement</p>
                    <p className="text-2xl font-bold text-emerald-400">{format(result.retirementSavings)}</p>
                </Card>
                <Card className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Required Nest Egg</p>
                    <p className="text-2xl font-bold">{format(result.requiredNestEgg)}</p>
                    <p className="text-xs text-slate-500 mt-1">25× annual expenses</p>
                </Card>
                <Card className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Safe Monthly Draw</p>
                    <p className="text-2xl font-bold text-amber-400">
                        {format(result.sustainableMonthlyWithdrawal)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">4% rule</p>
                </Card>
            </div>

            {/* Progress */}
            <Card>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-slate-400">Retirement Goal Progress</h3>
                    <span className={`text-sm font-semibold ${result.onTrack ? "text-emerald-400" : "text-amber-400"}`}>
                        {gapPct.toFixed(0)}%
                    </span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${result.onTrack ? "bg-emerald-500" : "bg-amber-500"}`}
                        style={{ width: `${gapPct}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{symbol}0</span>
                    <span>{format(result.requiredNestEgg)}</span>
                </div>
                {result.onTrack ? (
                    <p className="text-emerald-400 text-sm mt-2">
                        ✓ On track! Your projected savings exceed your required nest egg.
                    </p>
                ) : (
                    <p className="text-amber-400 text-sm mt-2">
                        You need {format(result.requiredNestEgg - result.retirementSavings)} more by retirement.
                        {result.depletionAge && ` Savings projected to run out at age ${result.depletionAge}.`}
                    </p>
                )}
            </Card>

            {/* Chart */}
            <Card>
                <h3 className="text-sm font-medium text-slate-400 mb-4">Savings Projection Over Time</h3>
                <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={result.data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradSavings" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="age" tick={{ fill: "#64748b", fontSize: 11 }} label={{ value: "Age", position: "insideBottom", offset: -5, fill: "#64748b", fontSize: 12 }} />
                        <YAxis tickFormatter={makeKFormatter(symbol)} tick={{ fill: "#64748b", fontSize: 11 }} />
                        <Tooltip
                            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                            formatter={(v) => [format(Number(v)), ""]}
                            labelFormatter={(l) => `Age ${l}`}
                        />
                        <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{v}</span>} />
                        <ReferenceLine x={form.retirementAge} stroke="#f59e0b" strokeDasharray="6 3" label={{ value: "Retire", fill: "#f59e0b", fontSize: 11 }} />
                        <ReferenceLine
                            y={result.requiredNestEgg}
                            stroke="#ef4444"
                            strokeDasharray="6 3"
                            label={{ value: "Goal", fill: "#ef4444", fontSize: 11, position: "right" }}
                        />
                        <Area type="monotone" dataKey="savings" name="Nominal Savings" stroke="#10b981" fill="url(#gradSavings)" strokeWidth={2} />
                        <Line type="monotone" dataKey="realSavings" name="Real (inflation-adj)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </Card>

            {/* Breakdown table */}
            <Card>
                <h3 className="text-sm font-medium text-slate-400 mb-4">10-Year Milestones</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-slate-500 border-b border-slate-700">
                                <th className="pb-2 text-left">Age</th>
                                <th className="pb-2 text-right">Nominal Savings</th>
                                <th className="pb-2 text-right">Real Value</th>
                                <th className="pb-2 text-right">Phase</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.data
                                .filter((d) => d.age % 5 === 0 || d.age === form.retirementAge)
                                .map((d) => (
                                    <tr key={d.age} className={`border-b border-slate-700/50 last:border-0 ${d.age === form.retirementAge ? "bg-amber-500/10" : ""}`}>
                                        <td className="py-2 font-medium">
                                            {d.age}
                                            {d.age === form.retirementAge && <span className="ml-2 text-xs text-amber-400">Retirement</span>}
                                        </td>
                                        <td className="py-2 text-right">{format(d.savings)}</td>
                                        <td className="py-2 text-right text-blue-400">{format(d.realSavings)}</td>
                                        <td className="py-2 text-right">
                                            <span className={`text-xs px-2 py-0.5 rounded capitalize ${d.phase === "accumulation" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                                                {d.phase}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
