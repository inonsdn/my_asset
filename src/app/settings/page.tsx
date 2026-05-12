"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { cache, getProfileId } from "@/lib/cache";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Trash2, Download, Upload, RefreshCw, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Investment, DCAConfig } from "@/lib/types";

export default function SettingsPage() {
  const store = useStore();
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleExport = () => {
    const data = {
      profile: store.profile,
      investments: store.investments,
      dcaConfigs: store.dcaConfigs,
      retirementConfig: store.retirementConfig,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.profile) await store.updateProfile(data.profile);
        if (data.retirementConfig) await store.updateRetirementConfig(data.retirementConfig);
        if (data.investments) {
          for (const inv of data.investments as Investment[]) await store.addInvestment(inv);
        }
        if (data.dcaConfigs) {
          for (const cfg of data.dcaConfigs as DCAConfig[]) await store.addDCAConfig(cfg);
        }
        alert("Import successful!");
      } catch {
        alert("Failed to import. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearCache = () => {
    cache.clear();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  const handleClearAll = () => {
    if (!confirm("Are you sure you want to delete ALL local data? This cannot be undone.")) return;
    cache.clear();
    localStorage.removeItem("finance_profile_id");
    window.location.reload();
  };

  const profileId = getProfileId();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage data, cache, and connection</p>
      </div>

      {/* Connection status */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Database size={18} className="text-blue-400" />
          <h2 className="text-base font-semibold">Supabase Connection</h2>
        </div>
        {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Connected to {process.env.NEXT_PUBLIC_SUPABASE_URL}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Offline mode — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
          </div>
        )}
        <p className="text-xs text-slate-500 mt-3 font-mono break-all">
          Profile ID: {profileId}
        </p>
      </Card>

      {/* Cache */}
      <Card>
        <h2 className="text-base font-semibold mb-2">Local Cache</h2>
        <p className="text-sm text-slate-400 mb-4">
          Data is cached in localStorage for fast loads. Cache TTL:{" "}
          <span className="text-slate-300 font-mono">
            {process.env.NEXT_PUBLIC_CACHE_TTL_SECONDS ?? 300}s
          </span>
          . Clearing the cache forces a fresh fetch from Supabase on next load.
        </p>
        <Button variant="secondary" onClick={handleClearCache}>
          <RefreshCw size={16} className={cacheCleared ? "animate-spin" : ""} />
          {cacheCleared ? "Cache cleared!" : "Clear Cache"}
        </Button>
      </Card>

      {/* Backup */}
      <Card>
        <h2 className="text-base font-semibold mb-4">Backup & Restore</h2>
        <p className="text-sm text-slate-400 mb-4">
          Export a JSON snapshot of all your data. Use this to migrate between devices.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} /> Export Backup
          </Button>
          <label className={cn(
            "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors cursor-pointer",
            "bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 px-4 py-2 text-sm"
          )}>
            <Upload size={16} /> Import Backup
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </Card>

      {/* Danger */}
      <Card className="border-red-500/30">
        <h2 className="text-base font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-400 mb-4">
          Clears the local cache and profile ID. Your Supabase data is unaffected.
        </p>
        <Button variant="danger" onClick={handleClearAll}>
          <Trash2 size={16} /> Clear Local Data
        </Button>
      </Card>

      <Card>
        <h2 className="text-base font-semibold mb-2">About</h2>
        <p className="text-sm text-slate-400">
          FinanceOS syncs to Supabase with a localStorage cache layer.
          Cache TTL is configurable via <span className="font-mono text-slate-300">NEXT_PUBLIC_CACHE_TTL_SECONDS</span>.
        </p>
        <p className="text-xs text-slate-600 mt-3">
          Stock prices via Yahoo Finance public API (no key required).
        </p>
      </Card>
    </div>
  );
}
