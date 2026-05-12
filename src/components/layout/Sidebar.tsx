"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, RefreshCw, Sunset, Settings, DollarSign, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency, type SupportedCurrency } from "@/lib/currency";
import { useAuth } from "@/lib/auth";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Income & Costs", icon: DollarSign },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/dca", label: "DCA Projections", icon: RefreshCw },
  { href: "/retirement", label: "Retirement Plan", icon: Sunset },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: User },
];

const CURRENCIES: { value: SupportedCurrency; flag: string; symbol: string }[] = [
  { value: "USD", flag: "🇺🇸", symbol: "$" },
  { value: "THB", flag: "🇹🇭", symbol: "฿" },
];

export default function Sidebar() {
  const path = usePathname();
  const { currency, setCurrency, usdRate, loading, lastUpdated } = useCurrency();
  const { user } = useAuth();

  const thbPerUsd = usdRate !== 1 ? usdRate : null;

  const avatar = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const name = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null;

  return (
    <aside className="w-56 shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col">
      <div className="p-5 border-b border-slate-700">
        <span className="font-bold text-lg tracking-tight text-emerald-400">FinanceOS</span>
        <p className="text-xs text-slate-400 mt-0.5">Personal Finance Dashboard</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              path === href
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Currency switcher */}
      <div className="p-3 border-t border-slate-700">
        <p className="text-xs text-slate-500 mb-2 px-1">Display currency</p>
        <div className="flex gap-1.5">
          {CURRENCIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCurrency(c.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                currency === c.value
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-700 text-slate-400 hover:text-slate-100 hover:bg-slate-600"
              )}
            >
              <span>{c.flag}</span>
              <span>{c.value}</span>
            </button>
          ))}
        </div>

        <div className="mt-2 px-1">
          {loading ? (
            <p className="text-xs text-slate-500 animate-pulse">Fetching rate…</p>
          ) : thbPerUsd ? (
            <div>
              <p className="text-xs text-slate-400">
                1 USD = <span className="text-emerald-400 font-semibold">฿{thbPerUsd.toFixed(2)}</span>
              </p>
              {lastUpdated && (
                <p className="text-[10px] text-slate-600 mt-0.5 truncate" title={lastUpdated}>
                  {new Date(lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-600">1 USD = $1.00</p>
          )}
        </div>
      </div>

      {/* User identity footer */}
      <div className="px-3 pb-3 border-t border-slate-700 pt-3">
        {user ? (
          <Link href="/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            {avatar ? (
              <img
                src={avatar}
                alt={name ?? "User"}
                className="w-7 h-7 rounded-full ring-1 ring-slate-600"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center">
                <User size={14} className="text-emerald-200" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{name ?? user.email}</p>
              <p className="text-[10px] text-emerald-400">Signed in</p>
            </div>
          </Link>
        ) : (
          <p className="text-xs text-slate-600">Data stored locally</p>
        )}
      </div>
    </aside>
  );
}
