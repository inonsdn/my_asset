"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { formatPercent } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import MoneyInput from "@/components/ui/MoneyInput";
import { useMarketPrices, useSinglePrice } from "@/hooks/useMarketPrices";
import { Plus, Trash2, ChevronDown, ChevronUp, RefreshCw, TrendingUp, TrendingDown, Pencil, Camera } from "lucide-react";
import { v4 as uuid } from "@/lib/uuid";
import type { Investment, InvestmentEntry, MarketPrice, PortfolioSnapshot } from "@/lib/types";
import { format as dateFmt } from "date-fns";

const TYPE_OPTIONS = [
  { value: "stock", label: "Stock" },
  { value: "etf", label: "ETF" },
  { value: "crypto", label: "Crypto" },
  { value: "gold", label: "Gold" },
  { value: "other", label: "Other" },
];

function AddInvestmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addInvestment } = useStore();
  const { format, fromUSD } = useCurrency();
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("stock");
  const { price, loading, refetch } = useSinglePrice(symbol.length > 0 ? symbol : null);

  const handleAdd = () => {
    if (!symbol || !name) return;
    addInvestment({ id: uuid(), symbol: symbol.toUpperCase(), name, type: type as Investment["type"], entries: [] });
    setSymbol(""); setName(""); setType("stock");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Investment" className="max-w-md">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              label="Symbol / Ticker"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="AAPL, BTC-USD, GC=F"
            />
          </div>
          <div className="mt-5">
            <Button variant="secondary" size="sm" onClick={refetch} disabled={!symbol || loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {price && (
          <div className="bg-slate-700 rounded-lg p-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Current Price</span>
              <span className="font-semibold">{format(fromUSD(price.price))}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-slate-400">Change</span>
              <span className={price.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}>
                {formatPercent(price.changePercent)}
              </span>
            </div>
          </div>
        )}

        <Input label="Name / Description" value={name} onChange={(e) => setName(e.target.value)} placeholder="Apple Inc." />
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value)} options={TYPE_OPTIONS} />
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleAdd} className="flex-1" disabled={!symbol || !name}>Add</Button>
        </div>
      </div>
    </Modal>
  );
}

function EntryModal({
  investment,
  entry,
  open,
  onClose,
}: {
  investment: Investment;
  entry?: InvestmentEntry;
  open: boolean;
  onClose: () => void;
}) {
  const { addInvestmentEntry, updateInvestmentEntry } = useStore();
  const { format, fromUSD, convertAmount, currency } = useCurrency();
  const [date, setDate] = useState(entry?.date ?? dateFmt(new Date(), "yyyy-MM-dd"));
  const [qty, setQty] = useState(entry?.quantity.toString() ?? "");
  const [price, setPrice] = useState(entry ? convertAmount(entry.pricePerUnit, entry.pricePerUnitCurrency ?? "USD", currency).toFixed(4) : "");
  const [priceCurrency, setPriceCurrency] = useState(entry?.pricePerUnitCurrency ?? currency);
  const [note, setNote] = useState(entry?.note ?? "");
  const { price: marketPrice, loading, refetch } = useSinglePrice(investment.symbol);

  useEffect(() => {
    if (entry) {
      setPrice(convertAmount(entry.pricePerUnit, entry.pricePerUnitCurrency ?? "USD", currency).toFixed(4));
      setPriceCurrency(entry.pricePerUnitCurrency ?? currency);
    }
  }, [convertAmount, entry, currency]);

  const totalDisplay = (parseFloat(qty) || 0) * (parseFloat(price) || 0);

  const handleSave = () => {
    if (!qty || !price) return;
    const qty_ = parseFloat(qty);
    const priceVal = parseFloat(price);
    if (entry) {
      updateInvestmentEntry(investment.id, {
        ...entry,
        date,
        quantity: qty_,
        pricePerUnit: priceVal,
        pricePerUnitCurrency: priceCurrency,
        totalCost: qty_ * priceVal,
        note: note || undefined,
      });
    } else {
      addInvestmentEntry(investment.id, {
        id: uuid(),
        date,
        quantity: qty_,
        pricePerUnit: priceVal,
        pricePerUnitCurrency: priceCurrency,
        totalCost: qty_ * priceVal,
        note,
      });
      setQty(""); setPrice(""); setNote("");
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`${entry ? "Edit" : "Add"} Entry — ${investment.symbol}`} className="max-w-md">
      <div className="space-y-4">
        {marketPrice && (
          <div className="bg-slate-700 rounded-lg p-3 text-sm flex justify-between items-center">
            <span className="text-slate-400">Current Market Price</span>
            <div className="text-right">
              <span className="font-semibold">{format(fromUSD(marketPrice.price))}</span>
              <button
                className="ml-2 text-xs text-emerald-400 hover:underline"
                onClick={() => setPrice(fromUSD(marketPrice.price).toFixed(4))}
              >
                Use
              </button>
            </div>
          </div>
        )}
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="Quantity / Units" type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
        <div className="flex gap-2">
          <div className="flex-1">
            <MoneyInput
              label="Price per Unit"
              value={price}
              onValueChange={setPrice}
              currency={priceCurrency}
              onCurrencyChange={setPriceCurrency}
              placeholder="0.00"
            />
          </div>
          <div className="mt-5">
            <Button variant="secondary" size="sm" onClick={refetch} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>
        {totalDisplay > 0 && (
          <div className="bg-slate-700 rounded-lg p-3 text-sm flex justify-between">
            <span className="text-slate-400">Total Cost</span>
            <span className="font-semibold">{format(totalDisplay)}</span>
          </div>
        )}
        <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. DCA purchase" />
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} className="flex-1" disabled={!qty || !price}>
            {entry ? "Save Changes" : "Add Entry"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function InvestmentCard({ inv, marketPrice }: { inv: Investment; marketPrice?: MarketPrice }) {
  const { removeInvestment, removeInvestmentEntry } = useStore();
  const { format, fromUSD, convertAmount, currency } = useCurrency();
  const [expanded, setExpanded] = useState(false);
  const [addingEntry, setAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<InvestmentEntry | null>(null);

  const totalCostDisplay = inv.entries.reduce((s, e) => s + convertAmount(e.totalCost, e.pricePerUnitCurrency ?? "USD", currency), 0);
  const totalQty = inv.entries.reduce((s, e) => s + e.quantity, 0);
  const avgCostDisplay = totalQty > 0 ? totalCostDisplay / totalQty : 0;
  // Market price from Yahoo Finance is in USD
  const currentValue = marketPrice ? fromUSD(marketPrice.price * totalQty) : null;
  const pnl = currentValue !== null ? currentValue - totalCostDisplay : null;
  const pnlPct = pnl !== null && totalCostDisplay > 0 ? (pnl / totalCostDisplay) * 100 : null;

  return (
    <Card className="space-y-0 p-0 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center font-bold text-sm">
              {inv.symbol.slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold">{inv.symbol}</p>
              <p className="text-xs text-slate-500">{inv.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded capitalize">{inv.type}</span>
            <Button variant="ghost" size="sm" onClick={() => removeInvestment(inv.id)}>
              <Trash2 size={14} className="text-red-400" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div>
            <p className="text-xs text-slate-500">Total Cost</p>
            <p className="font-semibold text-sm">{format(totalCostDisplay)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Quantity</p>
            <p className="font-semibold text-sm">{totalQty.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Avg Cost</p>
            <p className="font-semibold text-sm">{avgCostDisplay > 0 ? format(avgCostDisplay) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Current Price</p>
            <p className="font-semibold text-sm">{marketPrice ? format(fromUSD(marketPrice.price)) : "—"}</p>
          </div>
        </div>

        {pnl !== null && (
          <div className={`mt-3 p-2.5 rounded-lg text-sm flex items-center justify-between ${pnl >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
            <span className={pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
              {pnl >= 0 ? <TrendingUp size={14} className="inline mr-1" /> : <TrendingDown size={14} className="inline mr-1" />}
              Unrealized P&L
            </span>
            <span className={`font-semibold ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {format(pnl)} ({formatPercent(pnlPct!)})
            </span>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={() => setAddingEntry(true)}>
            <Plus size={14} /> Add Entry
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {inv.entries.length} entries
          </Button>
        </div>
      </div>

      {expanded && inv.entries.length > 0 && (
        <div className="border-t border-slate-700 p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-700">
                <th className="pb-2 text-left">Date</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">Total</th>
                <th className="pb-2 text-right">Note</th>
                <th className="pb-2 text-right" />
              </tr>
            </thead>
            <tbody>
              {inv.entries
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((e) => (
                  <tr key={e.id} className="border-b border-slate-700/50 last:border-0">
                    <td className="py-2 text-slate-400">{e.date}</td>
                    <td className="py-2 text-right">{e.quantity}</td>
                    <td className="py-2 text-right">{format(convertAmount(e.pricePerUnit, e.pricePerUnitCurrency ?? "USD", currency))}</td>
                    <td className="py-2 text-right font-medium">{format(convertAmount(e.totalCost, e.pricePerUnitCurrency ?? "USD", currency))}</td>
                    <td className="py-2 text-right text-slate-500 text-xs">{e.note || "—"}</td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingEntry(e)}
                          className="text-slate-600 hover:text-blue-400 transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => removeInvestmentEntry(inv.id, e.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {addingEntry && (
        <EntryModal investment={inv} open={addingEntry} onClose={() => setAddingEntry(false)} />
      )}
      {editingEntry && (
        <EntryModal
          investment={inv}
          entry={editingEntry}
          open
          onClose={() => setEditingEntry(null)}
        />
      )}
    </Card>
  );
}

export default function InvestmentsPage() {
  const { investments, addSnapshot } = useStore();
  const { format, fromUSD, convertAmount, currency } = useCurrency();
  const [addingInv, setAddingInv] = useState(false);
  const symbols = investments.map((i) => i.symbol);
  const { prices } = useMarketPrices(symbols);

  const totalCostDisplay = investments.reduce(
    (s, inv) => s + inv.entries.reduce((es, e) => es + convertAmount(e.totalCost, e.pricePerUnitCurrency ?? "USD", currency), 0),
    0
  );
  const totalValue = investments.reduce((s, inv) => {
    const qty = inv.entries.reduce((qs, e) => qs + e.quantity, 0);
    const p = prices[inv.symbol]?.price;
    const costDisplay = inv.entries.reduce((es, e) => es + convertAmount(e.totalCost, e.pricePerUnitCurrency ?? "USD", currency), 0);
    return s + (p ? fromUSD(p * qty) : costDisplay);
  }, 0);
  const totalPnl = totalValue - totalCostDisplay;

  const handleSnapshot = () => {
    const valueBySymbol: PortfolioSnapshot["valueBySymbol"] = {};
    let totalValueUsd = 0;
    for (const inv of investments) {
      const qty = inv.entries.reduce((s, e) => s + e.quantity, 0);
      const priceUsd = prices[inv.symbol]?.price ?? 0;
      const valueUsd = priceUsd * qty;
      totalValueUsd += valueUsd;
      if (qty > 0) {
        valueBySymbol[inv.symbol] = { qty, priceUsd, valueUsd };
      }
    }
    addSnapshot({
      snapshotDate: new Date().toISOString().slice(0, 10),
      totalValueUsd,
      valueBySymbol,
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investments</h1>
          <p className="text-slate-400 text-sm mt-1">Track your investment portfolio with real-time prices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleSnapshot}>
            <Camera size={14} /> Snapshot
          </Button>
          <Button onClick={() => setAddingInv(true)}>
            <Plus size={16} /> Add Investment
          </Button>
        </div>
      </div>

      {investments.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <p className="text-xs text-slate-400 mb-1">Total Cost Basis</p>
            <p className="text-xl font-bold">{format(totalCostDisplay)}</p>
          </Card>
          <Card className="text-center">
            <p className="text-xs text-slate-400 mb-1">Current Value</p>
            <p className="text-xl font-bold text-blue-400">{format(totalValue)}</p>
          </Card>
          <Card className="text-center">
            <p className="text-xs text-slate-400 mb-1">Unrealized P&L</p>
            <p className={`text-xl font-bold ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {format(totalPnl)}
            </p>
          </Card>
        </div>
      )}

      {investments.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-slate-400 mb-3">No investments yet</p>
          <Button onClick={() => setAddingInv(true)}>
            <Plus size={16} /> Add your first investment
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {investments.map((inv) => <InvestmentCard key={inv.id} inv={inv} marketPrice={prices[inv.symbol]} />)}
        </div>
      )}

      <AddInvestmentModal open={addingInv} onClose={() => setAddingInv(false)} />
    </div>
  );
}
