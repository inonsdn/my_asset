"use client";
import { Globe, X, LogIn } from "lucide-react";
import Button from "./Button";

interface Props {
  onSignIn: () => void;
  onCancel: () => void;
}

export default function AuthGateModal({ onSignIn, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center mx-auto mb-4">
          <LogIn size={24} className="text-emerald-400" />
        </div>

        <h2 className="text-lg font-semibold text-center mb-1">Sign in required</h2>
        <p className="text-sm text-slate-400 text-center mb-6">
          You need a Google account to save changes. Your data will be synced across all your devices.
        </p>

        <Button onClick={onSignIn} className="w-full justify-center" size="lg">
          <Globe size={18} />
          Continue with Google
        </Button>

        <button
          onClick={onCancel}
          className="mt-3 w-full text-sm text-slate-500 hover:text-slate-300 py-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
