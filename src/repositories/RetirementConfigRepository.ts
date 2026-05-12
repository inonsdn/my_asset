import type { RetirementConfigRow } from "@/lib/db/schema";
import type { RetirementConfig } from "@/lib/types";
import { retirementConfigFromRow, retirementConfigToInsert } from "@/lib/db/mappers";
import { cache } from "@/lib/cache";
import { v4 as uuid } from "@/lib/uuid";

const CACHE_KEY = (pid: string) => `retirement_config:${pid}`;

const DEFAULT_CONFIG: RetirementConfig = {
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

export class RetirementConfigRepository {
  constructor(private readonly client: any) {}

  private isOffline() {
    return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  async get(profileId: string): Promise<RetirementConfig> {
    const cached = cache.get<RetirementConfig>(CACHE_KEY(profileId));
    if (cached) return cached;

    if (this.isOffline()) return DEFAULT_CONFIG;

    const { data, error } = await this.client
      .from("retirement_configs")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) throw new Error(`[retirement_configs] get: ${error.message}`);
    if (!data) return DEFAULT_CONFIG;

    const result = retirementConfigFromRow(data as RetirementConfigRow);
    cache.set(CACHE_KEY(profileId), result);
    return result;
  }

  async upsert(profileId: string, cfg: RetirementConfig): Promise<void> {
    if (!this.isOffline()) {
      // Check if a row exists to get its id (needed for upsert by profile_id unique constraint)
      const { data: existing } = await this.client
        .from("retirement_configs")
        .select("id")
        .eq("profile_id", profileId)
        .maybeSingle();

      const row = retirementConfigToInsert(cfg, profileId, (existing as { id: string } | null)?.id ?? uuid());
      const { error } = await this.client
        .from("retirement_configs")
        .upsert(row, { onConflict: "profile_id" });
      if (error) throw new Error(`[retirement_configs] upsert: ${error.message}`);
    }
    cache.set(CACHE_KEY(profileId), cfg);
  }

  invalidateCache(profileId: string) {
    cache.invalidate(CACHE_KEY(profileId));
  }
}
