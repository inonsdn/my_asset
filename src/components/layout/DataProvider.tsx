"use client";
import { useEffect, useRef, useState } from "react";
import { getProfileId } from "@/lib/cache";
import { useAuth } from "@/lib/auth";
import {
  profileRepo, costItemRepo, investmentRepo,
  dcaConfigRepo, retirementConfigRepo, snapshotRepo,
} from "@/repositories";
import { initStore } from "@/lib/store";

export default function DataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const lastProfileIdRef = useRef<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    const profileId = user?.id ?? getProfileId();
    if (lastProfileIdRef.current === profileId) return;
    lastProfileIdRef.current = profileId;
    setReady(false);

    const store = initStore({
      profileRepo, costItemRepo, investmentRepo,
      dcaConfigRepo, retirementConfigRepo, snapshotRepo,
    });

    async function hydrate() {
      const [profileData, costItems, investments, dcaConfigs, retirementConfig, snapshots] =
        await Promise.all([
          profileRepo.get(profileId).catch(() => null),
          costItemRepo.getAll(profileId).catch(() => []),
          investmentRepo.getAll(profileId).catch(() => []),
          dcaConfigRepo.getAll(profileId).catch(() => []),
          retirementConfigRepo.get(profileId).catch(() => null),
          snapshotRepo.getAll(profileId).catch(() => []),
        ]);

      const monthlyCosts = costItems.filter((c) => c.frequency === "monthly");
      const yearlyCosts = costItems.filter((c) => c.frequency === "yearly");

      store.getState()._hydrate({
        profileId,
        profile: {
          monthlyIncome: profileData?.monthlyIncome ?? 0,
          monthlyIncomeCurrency: profileData?.monthlyIncomeCurrency ?? "USD",
          yearlyBonusIncome: profileData?.yearlyBonusIncome ?? 0,
          yearlyBonusIncomeCurrency: profileData?.yearlyBonusIncomeCurrency ?? "USD",
          currency: profileData?.currency ?? "USD",
          monthlyCosts,
          yearlyCosts,
        },
        investments,
        dcaConfigs,
        retirementConfig: retirementConfig ?? store.getState().retirementConfig,
        snapshots,
      });

      setReady(true);
    }

    hydrate();
  }, [authLoading, user]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading your data…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
