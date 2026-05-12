"use client";
import { create } from "zustand";
import type { FinancialProfile, Investment, InvestmentEntry, DCAConfig, RetirementConfig, PortfolioSnapshot } from "./types";
import { requireAuth } from "./authGate";

// ── State shape (pure UI state, no persistence here) ──────────
export interface AppState {
  profileId: string;
  profile: FinancialProfile;
  investments: Investment[];
  dcaConfigs: DCAConfig[];
  retirementConfig: RetirementConfig;
  snapshots: PortfolioSnapshot[];
  syncing: boolean;
  syncError: string | null;
}

// ── Actions ───────────────────────────────────────────────────
export interface AppActions {
  // Internal — called by DataProvider after loading from repos
  _hydrate: (state: Partial<AppState>) => void;

  // Profile
  updateProfile: (p: Partial<FinancialProfile>) => Promise<void>;

  // Investments
  addInvestment: (inv: Investment) => Promise<void>;
  removeInvestment: (id: string) => Promise<void>;
  addInvestmentEntry: (investmentId: string, entry: InvestmentEntry) => Promise<void>;
  updateInvestmentEntry: (investmentId: string, entry: InvestmentEntry) => Promise<void>;
  removeInvestmentEntry: (investmentId: string, entryId: string) => Promise<void>;

  // DCA
  addDCAConfig: (cfg: DCAConfig) => Promise<void>;
  updateDCAConfig: (id: string, cfg: Partial<DCAConfig>) => Promise<void>;
  removeDCAConfig: (id: string) => Promise<void>;

  // Retirement
  updateRetirementConfig: (cfg: Partial<RetirementConfig>) => Promise<void>;

  // Snapshots
  addSnapshot: (snap: Omit<PortfolioSnapshot, "id" | "createdAt">) => Promise<void>;
  removeSnapshot: (id: string) => Promise<void>;
}

export type AppStore = AppState & AppActions;

const defaultProfile: FinancialProfile = {
  monthlyIncome: 0,
  monthlyIncomeCurrency: "USD",
  yearlyBonusIncome: 0,
  yearlyBonusIncomeCurrency: "USD",
  monthlyCosts: [],
  yearlyCosts: [],
  currency: "USD",
};

const defaultRetirement: RetirementConfig = {
  currentAge: 30,
  retirementAge: 60,
  currentSavings: 0,
  currentSavingsCurrency: "USD",
  monthlyContribution: 1000,
  monthlyContributionCurrency: "USD",
  expectedAnnualReturn: 7,
  expectedInflation: 3,
  monthlyExpensesInRetirement: 3000,
  monthlyExpensesInRetirementCurrency: "USD",
};

// ── Factory — repos injected to avoid circular imports ────────
export function createStore(repos: {
  profileRepo: import("@/repositories/ProfileRepository").ProfileRepository;
  costItemRepo: import("@/repositories/CostItemRepository").CostItemRepository;
  investmentRepo: import("@/repositories/InvestmentRepository").InvestmentRepository;
  dcaConfigRepo: import("@/repositories/DCAConfigRepository").DCAConfigRepository;
  retirementConfigRepo: import("@/repositories/RetirementConfigRepository").RetirementConfigRepository;
  snapshotRepo: import("@/repositories/PortfolioSnapshotRepository").PortfolioSnapshotRepository;
}) {
  return create<AppStore>()((set, get) => ({
    profileId: "",
    profile: defaultProfile,
    investments: [],
    dcaConfigs: [],
    retirementConfig: defaultRetirement,
    snapshots: [],
    syncing: false,
    syncError: null,

    _hydrate: (state) => set((s) => ({ ...s, ...state })),

    // ── Profile ────────────────────────────────────────────────
    updateProfile: async (partial) => {
      if (!(await requireAuth())) return;
      const { profileId, profile } = get();
      const next: FinancialProfile = { ...profile, ...partial };
      set({ profile: next });
      try {
        await repos.profileRepo.upsert(profileId, next);
        if (partial.monthlyCosts !== undefined) {
          await repos.costItemRepo.replaceAll(profileId, next.monthlyCosts, "monthly");
        }
        if (partial.yearlyCosts !== undefined) {
          await repos.costItemRepo.replaceAll(profileId, next.yearlyCosts, "yearly");
        }
      } catch (e) {
        set({ profile, syncError: (e as Error).message });
      }
    },

    // ── Investments ────────────────────────────────────────────
    addInvestment: async (inv) => {
      if (!(await requireAuth())) return;
      const { profileId } = get();
      set((s) => ({ investments: [...s.investments, inv] }));
      try {
        await repos.investmentRepo.upsert(profileId, inv);
      } catch (e) {
        set((s) => ({ investments: s.investments.filter((i) => i.id !== inv.id), syncError: (e as Error).message }));
      }
    },

    removeInvestment: async (id) => {
      if (!(await requireAuth())) return;
      const { profileId, investments } = get();
      set({ investments: investments.filter((i) => i.id !== id) });
      try {
        await repos.investmentRepo.delete(profileId, id);
      } catch (e) {
        set({ investments, syncError: (e as Error).message });
      }
    },

    addInvestmentEntry: async (investmentId, entry) => {
      if (!(await requireAuth())) return;
      const { profileId } = get();
      set((s) => ({
        investments: s.investments.map((i) =>
          i.id === investmentId ? { ...i, entries: [...i.entries, entry] } : i
        ),
      }));
      try {
        await repos.investmentRepo.addEntry(profileId, investmentId, entry);
      } catch (e) {
        set((s) => ({
          investments: s.investments.map((i) =>
            i.id === investmentId ? { ...i, entries: i.entries.filter((e2) => e2.id !== entry.id) } : i
          ),
          syncError: (e as Error).message,
        }));
      }
    },

    updateInvestmentEntry: async (investmentId, entry) => {
      if (!(await requireAuth())) return;
      const { profileId, investments } = get();
      set((s) => ({
        investments: s.investments.map((i) =>
          i.id === investmentId
            ? { ...i, entries: i.entries.map((e) => (e.id === entry.id ? entry : e)) }
            : i
        ),
      }));
      try {
        await repos.investmentRepo.updateEntry(profileId, investmentId, entry);
      } catch (e) {
        set({ investments, syncError: (e as Error).message });
      }
    },

    removeInvestmentEntry: async (investmentId, entryId) => {
      if (!(await requireAuth())) return;
      const { profileId, investments } = get();
      set((s) => ({
        investments: s.investments.map((i) =>
          i.id === investmentId ? { ...i, entries: i.entries.filter((e) => e.id !== entryId) } : i
        ),
      }));
      try {
        await repos.investmentRepo.deleteEntry(profileId, investmentId, entryId);
      } catch (e) {
        set({ investments, syncError: (e as Error).message });
      }
    },

    // ── DCA ────────────────────────────────────────────────────
    addDCAConfig: async (cfg) => {
      if (!(await requireAuth())) return;
      const { profileId } = get();
      set((s) => ({ dcaConfigs: [...s.dcaConfigs, cfg] }));
      try {
        await repos.dcaConfigRepo.upsert(profileId, cfg);
      } catch (e) {
        set((s) => ({ dcaConfigs: s.dcaConfigs.filter((c) => c.id !== cfg.id), syncError: (e as Error).message }));
      }
    },

    updateDCAConfig: async (id, partial) => {
      if (!(await requireAuth())) return;
      const { profileId, dcaConfigs } = get();
      const updated = dcaConfigs.map((c) => (c.id === id ? { ...c, ...partial } : c));
      set({ dcaConfigs: updated });
      try {
        const cfg = updated.find((c) => c.id === id)!;
        await repos.dcaConfigRepo.upsert(profileId, cfg);
      } catch (e) {
        set({ dcaConfigs, syncError: (e as Error).message });
      }
    },

    removeDCAConfig: async (id) => {
      if (!(await requireAuth())) return;
      const { profileId, dcaConfigs } = get();
      set({ dcaConfigs: dcaConfigs.filter((c) => c.id !== id) });
      try {
        await repos.dcaConfigRepo.delete(profileId, id);
      } catch (e) {
        set({ dcaConfigs, syncError: (e as Error).message });
      }
    },

    // ── Retirement ─────────────────────────────────────────────
    updateRetirementConfig: async (partial) => {
      if (!(await requireAuth())) return;
      const { profileId, retirementConfig } = get();
      const next: RetirementConfig = { ...retirementConfig, ...partial };
      set({ retirementConfig: next });
      try {
        await repos.retirementConfigRepo.upsert(profileId, next);
      } catch (e) {
        set({ retirementConfig, syncError: (e as Error).message });
      }
    },

    // ── Snapshots ──────────────────────────────────────────────
    addSnapshot: async (snap) => {
      if (!(await requireAuth())) return;
      const { profileId } = get();
      try {
        const full = await repos.snapshotRepo.add(profileId, snap);
        set((s) => ({ snapshots: [...s.snapshots, full].sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate)) }));
      } catch (e) {
        set({ syncError: (e as Error).message });
      }
    },

    removeSnapshot: async (id) => {
      if (!(await requireAuth())) return;
      const { profileId, snapshots } = get();
      set((s) => ({ snapshots: s.snapshots.filter((s2) => s2.id !== id) }));
      try {
        await repos.snapshotRepo.delete(profileId, id);
      } catch (e) {
        set({ snapshots, syncError: (e as Error).message });
      }
    },
  }));
}

// ── Lazy singleton ─────────────────────────────────────────────
// Populated in DataProvider on first client render.
let _store: ReturnType<typeof createStore> | null = null;

export function getStore(): ReturnType<typeof createStore> {
  if (!_store) throw new Error("Store not initialized. Wrap your app in <DataProvider>.");
  return _store;
}

export function initStore(repos: Parameters<typeof createStore>[0]) {
  if (!_store) _store = createStore(repos);
  return _store;
}

// Convenience hook — must be called inside components wrapped by DataProvider
export function useStore() {
  return getStore()();
}
