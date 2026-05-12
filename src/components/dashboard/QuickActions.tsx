"use client";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { DollarSign, TrendingUp, RefreshCw, Sunset, ArrowRight } from "lucide-react";

const actions = [
  { href: "/income", label: "Update Income & Costs", icon: DollarSign, color: "text-emerald-400" },
  { href: "/investments", label: "Add Investment", icon: TrendingUp, color: "text-blue-400" },
  { href: "/dca", label: "Create DCA Plan", icon: RefreshCw, color: "text-purple-400" },
  { href: "/retirement", label: "Plan Retirement", icon: Sunset, color: "text-amber-400" },
];

export default function QuickActions() {
  return (
    <Card>
      <h3 className="text-sm font-medium text-slate-400 mb-3">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-700 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Icon size={16} className={color} />
              <span className="text-sm">{label}</span>
            </div>
            <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
