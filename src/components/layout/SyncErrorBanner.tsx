"use client";
import { useStore } from "@/lib/store";
import { AlertCircle, X } from "lucide-react";

export default function SyncErrorBanner() {
  const { syncError, _hydrate } = useStore();
  if (!syncError) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-red-900/90 border border-red-700 text-red-200 text-sm px-4 py-3 rounded-xl shadow-xl max-w-sm">
      <AlertCircle size={16} className="shrink-0 text-red-400" />
      <span className="flex-1">{syncError}</span>
      <button onClick={() => _hydrate({ syncError: null })} className="text-red-400 hover:text-red-200">
        <X size={14} />
      </button>
    </div>
  );
}
