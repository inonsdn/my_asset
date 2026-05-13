"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import MoneyInput from "@/components/ui/MoneyInput";
import { Plus, Trash2, Pencil } from "lucide-react";
import { v4 as uuid } from "@/lib/uuid";
import type { CostItem } from "@/lib/types";

const CATEGORIES = ["Housing", "Food", "Transport", "Healthcare", "Entertainment", "Education", "Insurance", "Utilities", "Investment", "Other"];
const categoryOptions = CATEGORIES.map((c) => ({ value: c.toLowerCase(), label: c }));

function CostRow({
  item,
  onEdit,
  onRemove,
}: {
  item: CostItem;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { format, convertAmount, currency } = useCurrency();
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0">
      <div>
        <p className="text-sm font-medium">{item.name}</p>
        <span className="text-xs text-slate-500 capitalize bg-slate-700 px-1.5 py-0.5 rounded mt-0.5 inline-block">
          {item.category}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm mr-1">{format(convertAmount(item.amount, item.amountCurrency ?? "USD", currency))}</span>
        <button onClick={onEdit} className="text-slate-500 hover:text-blue-400 transition-colors">
          <Pencil size={13} />
        </button>
        <button onClick={onRemove} className="text-slate-500 hover:text-red-400 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function CostModal({
  open,
  onClose,
  onSave,
  title,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (item: CostItem) => void;
  title: string;
  initial?: CostItem;
}) {
  const { currency, convertAmount } = useCurrency();
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(
    initial ? convertAmount(initial.amount, initial.amountCurrency ?? "USD", currency).toFixed(2) : ""
  );
  const [amtCurrency, setAmtCurrency] = useState(initial?.amountCurrency ?? currency);
  const [category, setCategory] = useState(initial?.category ?? "other");

  // Re-sync amount when display currency changes
  useEffect(() => {
    if (initial) setAmount(convertAmount(initial.amount, initial.amountCurrency ?? "USD", currency).toFixed(2));
  }, [convertAmount, initial, currency]);

  const handleSave = () => {
    if (!name || !amount) return;
    onSave({ id: initial?.id ?? uuid(), name, amount: parseFloat(amount), amountCurrency: amtCurrency, category });
    if (!initial) { setName(""); setAmount(""); setCategory("other"); }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-md">
      <div className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rent, Groceries" />
        <MoneyInput
          label="Amount"
          value={amount}
          onValueChange={setAmount}
          currency={amtCurrency}
          onCurrencyChange={setAmtCurrency}
          placeholder="0.00"
        />
        <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={categoryOptions} />
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} className="flex-1" disabled={!name || !amount}>
            {initial ? "Save Changes" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function IncomePage() {
  const { profile, updateProfile } = useStore();
  const { format, convertAmount, currency } = useCurrency();
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [incomeCurrency, setIncomeCurrency] = useState(profile.monthlyIncomeCurrency ?? "USD");
  const [bonusIncome, setBonusIncome] = useState("");
  const [bonusCurrency, setBonusCurrency] = useState(profile.yearlyBonusIncomeCurrency ?? "USD");
  const [addingMonthly, setAddingMonthly] = useState(false);
  const [addingYearly, setAddingYearly] = useState(false);
  const [editingItem, setEditingItem] = useState<{ item: CostItem; freq: "monthly" | "yearly" } | null>(null);

  // Sync inputs to display currency whenever stored value or rate changes
  useEffect(() => {
    setMonthlyIncome(convertAmount(profile.monthlyIncome, profile.monthlyIncomeCurrency ?? "USD", currency).toFixed(2));
    setIncomeCurrency(profile.monthlyIncomeCurrency ?? "USD");
    setBonusIncome(convertAmount(profile.yearlyBonusIncome, profile.yearlyBonusIncomeCurrency ?? "USD", currency).toFixed(2));
    setBonusCurrency(profile.yearlyBonusIncomeCurrency ?? "USD");
  }, [profile.monthlyIncome, profile.monthlyIncomeCurrency, profile.yearlyBonusIncome, profile.yearlyBonusIncomeCurrency, convertAmount, currency]);

  const save = () => {
    updateProfile({
      monthlyIncome: parseFloat(monthlyIncome) || 0,
      monthlyIncomeCurrency: incomeCurrency,
      yearlyBonusIncome: parseFloat(bonusIncome) || 0,
      yearlyBonusIncomeCurrency: bonusCurrency,
    });
  };

  const totalMonthlyExpenses =
    profile.monthlyCosts.reduce((s, c) => s + convertAmount(c.amount, c.amountCurrency ?? "USD", currency), 0) +
    profile.yearlyCosts.reduce((s, c) => s + convertAmount(c.amount, c.amountCurrency ?? "USD", currency), 0) / 12;
  const monthlyIncomeDisplay = convertAmount(profile.monthlyIncome, profile.monthlyIncomeCurrency ?? "USD", currency);
  const monthlyNet = monthlyIncomeDisplay - totalMonthlyExpenses;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Income & Costs</h1>
        <p className="text-slate-400 text-sm mt-1">Track your income sources and recurring expenses</p>
      </div>

      {/* Income */}
      <Card>
        <h2 className="text-base font-semibold mb-4">Income</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MoneyInput
            label="Monthly Income (after tax)"
            value={monthlyIncome}
            onValueChange={setMonthlyIncome}
            currency={incomeCurrency}
            onCurrencyChange={setIncomeCurrency}
            placeholder="0.00"
          />
          <MoneyInput
            label="Yearly Bonus / Extra Income"
            value={bonusIncome}
            onValueChange={setBonusIncome}
            currency={bonusCurrency}
            onCurrencyChange={setBonusCurrency}
            placeholder="0.00"
          />
        </div>
        <Button onClick={save} className="mt-4" size="sm">Save Income</Button>
      </Card>

      {/* Summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-xs text-slate-400 mb-1">Total Income / mo</p>
          <p className="text-xl font-bold text-emerald-400">{format(monthlyIncomeDisplay)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-slate-400 mb-1">Total Expenses / mo</p>
          <p className="text-xl font-bold text-red-400">{format(totalMonthlyExpenses)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-slate-400 mb-1">Net / mo</p>
          <p className={`text-xl font-bold ${monthlyNet >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {format(monthlyNet)}
          </p>
        </Card>
      </div>

      {/* Monthly Costs */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold">Monthly Costs</h2>
            <p className="text-xs text-slate-500">
              Total: {format(profile.monthlyCosts.reduce((s, c) => s + convertAmount(c.amount, c.amountCurrency ?? "USD", currency), 0))}/mo
            </p>
          </div>
          <Button size="sm" onClick={() => setAddingMonthly(true)}>
            <Plus size={14} /> Add
          </Button>
        </div>
        {profile.monthlyCosts.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No monthly costs yet</p>
        ) : (
          profile.monthlyCosts.map((item) => (
            <CostRow
              key={item.id}
              item={item}
              onEdit={() => setEditingItem({ item, freq: "monthly" })}
              onRemove={() =>
                updateProfile({ monthlyCosts: profile.monthlyCosts.filter((c) => c.id !== item.id) })
              }
            />
          ))
        )}
      </Card>

      {/* Yearly Costs */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold">Yearly Costs</h2>
            <p className="text-xs text-slate-500">
              Total: {format(profile.yearlyCosts.reduce((s, c) => s + convertAmount(c.amount, c.amountCurrency ?? "USD", currency), 0))}/yr
              {" · "}
              {format(profile.yearlyCosts.reduce((s, c) => s + convertAmount(c.amount, c.amountCurrency ?? "USD", currency), 0) / 12)}/mo avg
            </p>
          </div>
          <Button size="sm" onClick={() => setAddingYearly(true)}>
            <Plus size={14} /> Add
          </Button>
        </div>
        {profile.yearlyCosts.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No yearly costs yet</p>
        ) : (
          profile.yearlyCosts.map((item) => (
            <CostRow
              key={item.id}
              item={item}
              onEdit={() => setEditingItem({ item, freq: "yearly" })}
              onRemove={() =>
                updateProfile({ yearlyCosts: profile.yearlyCosts.filter((c) => c.id !== item.id) })
              }
            />
          ))
        )}
      </Card>

      <CostModal
        open={addingMonthly}
        onClose={() => setAddingMonthly(false)}
        onSave={(item) => updateProfile({ monthlyCosts: [...profile.monthlyCosts, item] })}
        title="Add Monthly Cost"
      />
      <CostModal
        open={addingYearly}
        onClose={() => setAddingYearly(false)}
        onSave={(item) => updateProfile({ yearlyCosts: [...profile.yearlyCosts, item] })}
        title="Add Yearly Cost"
      />
      {editingItem && (
        <CostModal
          open
          onClose={() => setEditingItem(null)}
          initial={editingItem.item}
          title={`Edit ${editingItem.freq === "monthly" ? "Monthly" : "Yearly"} Cost`}
          onSave={(updated) => {
            if (editingItem.freq === "monthly") {
              updateProfile({
                monthlyCosts: profile.monthlyCosts.map((c) => (c.id === updated.id ? updated : c)),
              });
            } else {
              updateProfile({
                yearlyCosts: profile.yearlyCosts.map((c) => (c.id === updated.id ? updated : c)),
              });
            }
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
